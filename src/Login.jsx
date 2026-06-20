import React, { useState } from "react";
import { supabase } from "./supabaseClient";

const INK = "#111110";
const RED = "#B91C1C";
const CREAM = "#F8F5F0";

export default function Login() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setInfo("Check your email to confirm your account, then sign in.");
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center px-4" style={{ background: CREAM }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="block h-1.5 w-10 rounded-full" style={{ background: RED }} />
          <h1 className="text-lg font-extrabold uppercase tracking-[0.2em]" style={{ color: INK }}>
            Manifest Fitness
          </h1>
          <p className="text-xs uppercase tracking-widest text-black/40">Staff Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-black/40">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-black/30"
              placeholder="you@manifestfitness.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-black/40">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-black/30"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          {info && (
            <p className="text-xs font-medium" style={{ color: RED }}>
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: INK }}
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setInfo("");
          }}
          className="mt-4 w-full text-center text-xs font-semibold text-black/50"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
