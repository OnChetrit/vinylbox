'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "../providers/SupabaseProvider";
import styles from "./AuthForm.module.scss";

export default function AuthForm() {
  const { supabase, ready } = useSupabase();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!ready) {
      setError("Supabase env vars missing. Add them to .env.local.");
      setLoading(false);
      return;
    }

    const action =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error: authError } = await action;

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/");
  };

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Welcome to VinylBox</h1>
      <p className={styles.subtitle}>
        Sign in to manage your collection and wishlist.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>
          Email
          <input
            className={styles.input}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Password
          <input
            className={styles.input}
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error ? <div className={styles.error}>{error}</div> : null}

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" />{" "}
              {mode === "login" ? "Logging in..." : "Creating account..."}
            </>
          ) : mode === "login" ? (
            "Login"
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <div className={styles.switch}>
        {mode === "login" ? (
          <>
            Need an account?{" "}
            <button
              type="button"
              className={styles.button}
              style={{ marginTop: 8 }}
              onClick={() => setMode("signup")}
            >
              Switch to sign up
            </button>
          </>
        ) : (
          <>
            Already a member?{" "}
            <button
              type="button"
              className={styles.button}
              style={{ marginTop: 8 }}
              onClick={() => setMode("login")}
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

