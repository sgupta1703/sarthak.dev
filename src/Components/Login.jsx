import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  const handleInputClick = (e) => {
    e.stopPropagation();
  };

  const handleInputFocus = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={handleInputClick}
      style={{
        background: "var(--panel)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "var(--radius)",
        padding: "24px",
        maxWidth: "400px",
        width: "100%",
        marginTop: "40px",
      }}
    >
      <h2 style={{ marginTop: 0, color: "var(--accent-green)" }}>
        Developer Login
      </h2>
      <form onSubmit={handleLogin}>
        <label
          htmlFor="email"
          style={{
            display: "block",
            marginBottom: "8px",
            color: "var(--muted)",
          }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          placeholder="you@example.com"
          required
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.02)",
            color: "var(--text)",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />

        <label
          htmlFor="password"
          style={{
            display: "block",
            marginTop: "16px",
            marginBottom: "8px",
            color: "var(--muted)",
          }}
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          placeholder="••••••••"
          required
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.02)",
            color: "var(--text)",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          onClick={handleInputClick}
          style={{
            marginTop: "16px",
            background: loading ? "var(--muted)" : "var(--accent-cyan)",
            color: "#000",
            padding: "8px 16px",
            borderRadius: "6px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            border: "none",
            width: "100%",
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {error && (
        <div className="error" style={{ marginTop: 12, color: "#ff6b6b" }}>
          {error}
        </div>
      )}

      <button
        onClick={(e) => {
          handleInputClick(e);
          onClose();
        }}
        style={{
          marginTop: "20px",
          background: "transparent",
          border: "none",
          color: "var(--muted)",
          cursor: "pointer",
          textDecoration: "underline",
          width: "100%",
        }}
      >
        Close
      </button>

      <div
        style={{
          marginTop: "16px",
          fontSize: "0.85rem",
          color: "var(--muted)",
          textAlign: "center",
        }}
      >
        Need developer access? Contact the site owner.
      </div>
    </div>
  );
}