import React, { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Signin.css";
import bg from "./Assets/banner2.png";
import brandMark from "./Assets/logo.png";
import googleLogo from "./Assets/google.png";

export default function Signin() {
  const navigate = useNavigate();
  const location = useLocation();
  const nextFromState = location.state?.next;
  const nextFromQuery = new URLSearchParams(location.search).get("next");
  const next = nextFromState || nextFromQuery || "/";

  useEffect(() => {
    document.body.classList.add("signin-view");
    return () => document.body.classList.remove("signin-view");
  }, []);

  // if already signed in, skip this screen
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) navigate(next, { replace: true });
    });
    return unsub;
  }, [navigate, next]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleGoogle = async () => {
    if (loading) return;
    setErr("");
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate(next, { replace: true });
    } catch (e) {
      const msg = String(e?.message || e)
        .replace(/^Firebase:\s*/i, "")
        .replace(/\(auth\/.+\)\.?$/i, "")
        .trim();
      setErr(msg || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="signin-hero"
      style={{
        backgroundImage:
          `linear-gradient(0deg, rgba(0,0,0,.35), rgba(0,0,0,.35)), url(${bg})`,
      }}
    >
      <section className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <img src={brandMark} alt="Recipe Palette" />
        </div>

        {/* Title */}
        <h1 className="auth-title">
          WELCOME TO <span className="accent">RECIPE&nbsp;PALETTE</span>
        </h1>

        {/* Paragraph */}
        <p className="auth-copy">
          Discover recipes you love, explore flavors from around the world, and
          make every meal special with Recipe&nbsp;Palette. Your trusted
          kitchen companion for everyday inspiration.
        </p>
        {/* Google CTA */}
        <button
          type="button"
          className="google-cta"
          onClick={handleGoogle}
          disabled={loading}
          aria-label="Continue with Google"
        >
          <span className="g-icon">
            <img className="g-logo" src={googleLogo} alt="" />
          </span>
          <span>{loading ? "Signing in…" : "Continue with Google"}</span>
        </button>

        {err && <div className="auth-error">{err}</div>}

        {/* Back link */}
        <div className="auth-back">
          <Link to="/" className="auth-back-link">Back to Home</Link>
        </div>
      </section>
    </section>
  );
}
