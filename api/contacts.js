import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Verify the logged-in user
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: "Invalid session" });
  }
  const userId = userData.user.id;

  // Find which client (gym) this user belongs to
  const { data: linkRow, error: linkError } = await supabaseAdmin
    .from("client_users")
    .select("client_id")
    .eq("user_id", userId)
    .single();

  if (linkError || !linkRow) {
    return res.status(403).json({ error: "No client linked to this user" });
  }

  // Get that client's GHL credentials
  const { data: client, error: clientError } = await supabaseAdmin
    .from("clients")
    .select("ghl_location_id, ghl_api_key")
    .eq("id", linkRow.client_id)
    .single();

  if (clientError || !client) {
    return res.status(403).json({ error: "Client not found" });
  }

  // Call GHL with the client's own key — never exposed to the browser
  try {
    const ghlRes = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${client.ghl_location_id}&limit=100`,
      {
        headers: {
          Authorization: `Bearer ${client.ghl_api_key}`,
          Version: "2021-07-28",
          Accept: "application/json",
        },
      }
    );

    if (!ghlRes.ok) {
      const errText = await ghlRes.text();
      return res.status(ghlRes.status).json({ error: "GHL API error", detail: errText });
    }

    const ghlData = await ghlRes.json();
    return res.status(200).json({ contacts: ghlData.contacts || [] });
  } catch (err) {
    return res.status(500).json({ error: "Failed to reach GHL", detail: err.message });
  }
}
