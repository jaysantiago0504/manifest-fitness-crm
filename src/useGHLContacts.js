import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export function useGHLContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchContacts() {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error("Not signed in");
        }

        const res = await fetch("/api/contacts", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to load contacts");
        }

        if (isMounted) setContacts(json.contacts || []);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchContacts();
    return () => {
      isMounted = false;
    };
  }, []);

  return { contacts, loading, error };
}
