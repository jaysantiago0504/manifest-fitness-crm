import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export function useGHLCalendar() {
  const [events, setEvents] = useState([]);
  const [weekStart, setWeekStart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("Not signed in");

        const res = await fetch("/api/calendar", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load calendar");

        if (isMounted) {
          setEvents(json.events || []);
          setWeekStart(json.weekStart || null);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    run();
    return () => {
      isMounted = false;
    };
  }, []);

  return { events, weekStart, loading, error };
}
