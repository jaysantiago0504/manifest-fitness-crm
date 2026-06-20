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
    // 1. Get all calendars for this location
    const calRes = await fetch(
      `https://services.leadconnectorhq.com/calendars/?locationId=${client.ghl_location_id}`,
      { headers: ghlHeaders }
    );
    if (!calRes.ok) {
      const detail = await calRes.text();
      return res.status(calRes.status).json({ error: "GHL calendars error", detail });
    }
    const calData = await calRes.json();
    const calendars = calData.calendars || [];

    if (calendars.length === 0) {
      return res.status(200).json({ events: [], weekStart: null });
    }

    // 2. Compute this week's Monday 00:00 -> next Monday 00:00
    const now = new Date();
    const day = now.getDay(); // Sun=0..Sat=6
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() + diffToMonday);
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);

    const startTime = monday.getTime();
    const endTime = nextMonday.getTime();

    // 3. Pull events from every calendar for this week
    let allEvents = [];
    for (const cal of calendars) {
      const evRes = await fetch(
        `https://services.leadconnectorhq.com/calendars/events?locationId=${client.ghl_location_id}&calendarId=${cal.id}&startTime=${startTime}&endTime=${endTime}`,
        { headers: ghlHeaders }
      );
      if (evRes.ok) {
        const evData = await evRes.json();
        allEvents = allEvents.concat(evData.events || []);
      }
    }

    return res.status(200).json({ events: allEvents, weekStart: startTime });
  } catch (err) {
    return res.status(500).json({ error: "Failed to reach GHL", detail: err.message });
  }
}
