import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import App from "./App";

const CREAM = "#F8F5F0";

export default function AuthGate() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ background: CREAM }}>
        <p className="text-sm text-black/40">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return <App onSignOut={handleSignOut} />;
}
