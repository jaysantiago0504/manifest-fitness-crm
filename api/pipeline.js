import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getClientCreds(token) {
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return { error: { status: 401, message: "Invalid session" } };
  }
  const userId = userData.user.id;

  const { data: linkRow, error: linkError } = await supabaseAdmin
    .from("client_users")
    .select("client_id")
    .eq("user_id", userId)
    .single();
  if (linkError || !linkRow) {
    return { error: { status: 403, message: "No client linked to this user" } };
  }

  const { data: client, error: clientError } = await supabaseAdmin
    .from("clients")
    .select("ghl_location_id, ghl_api_key")
    .eq("id", linkRow.client_id)
    .single();
  if (clientError || !client) {
    return { error: { status: 403, message: "Client not found" } };
  }

  return { client };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  const { client, error } = await getClientCreds(token);
  if (error) return res.status(error.status).json({ error: error.message });

  const ghlHeaders = {
    Authorization: `Bearer ${client.ghl_api_key}`,
    Version: "2021-07-28",
    Accept: "application/json",
  };

  try {
    // 1. Get pipelines for this location
    const pipeRes = await fetch(
      `https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${client.ghl_location_id}`,
      { headers: ghlHeaders }
    );
    if (!pipeRes.ok) {
      const detail = await pipeRes.text();
      return res.status(pipeRes.status).json({ error: "GHL pipelines error", detail });
    }
    const pipeData = await pipeRes.json();
    const pipelines = pipeData.pipelines || [];

    if (pipelines.length === 0) {
      return res.status(200).json({ pipelineName: null, stages: [] });
    }

    // Use the first pipeline for now — multi-pipeline support can come later
    const pipeline = pipelines[0];

    // 2. Get opportunities in that pipeline
    const oppRes = await fetch(
      `https://services.leadconnectorhq.com/opportunities/search?location_id=${client.ghl_location_id}&pipeline_id=${pipeline.id}&limit=100`,
      { headers: ghlHeaders }
    );
    if (!oppRes.ok) {
      const detail = await oppRes.text();
      return res.status(oppRes.status).json({ error: "GHL opportunities error", detail });
    }
    const oppData = await oppRes.json();
    const opportunities = oppData.opportunities || [];

    // 3. Group opportunities under their stage
    const stages = (pipeline.stages || []).map((stage) => ({
      id: stage.id,
      name: stage.name,
      opportunities: opportunities
        .filter((o) => o.pipelineStageId === stage.id)
        .map((o) => ({
          id: o.id,
          name: o.name || o.contactName || "Untitled",
          value:
            typeof o.monetaryValue === "number" ? `$${o.monetaryValue}` : "$0",
        })),
    }));

    return res.status(200).json({ pipelineName: pipeline.name, stages });
  } catch (err) {
    return res.status(500).json({ error: "Failed to reach GHL", detail: err.message });
  }
}
