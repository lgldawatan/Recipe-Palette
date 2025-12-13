"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!username.trim() || !password.trim()) {
            setErrorMsg("Please enter both username and password.");
            return;
        }

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.message || "Invalid username or password.");
                return;
            }

            router.push("/admin/recipes");
        } catch {
            setErrorMsg("Something went wrong. Please try again.");
        }
    };



    return (
        <>
            {/* Links */}
            <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
            />

            <link
                rel="preconnect"
                href="https://fonts.googleapis.com"
            />
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
                rel="stylesheet"
            />

            <main className="login-page">
                <div className="overlay" />

                <section className="login-card">
                    {/* LOGO */}
                    <div className="logo-wrap">
                        <Image
                            src="/Images/logo.png"
                            alt="Recipe Palette Logo"
                            width={180}
                            height={180}
                            priority
                        />
                    </div>

                    {/* TITLE */}
                    <h1 className="title">
                        WELCOME TO <span>RECIPE PALETTE</span>
                    </h1>

                    {/* DESCRIPTION */}
                    <p className="desc">
                        Discover recipes you love, explore flavors from around the world, and
                        make every meal special with Recipe Palette. Your trusted kitchen
                        companion for everyday inspiration.
                    </p>

                    {/* FORM */}
                    <form onSubmit={handleSubmit} className="form">
                        <input
                            type="text"
                            placeholder="Enter Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />

                        <div className="password-wrap">
                            <input
                                type={showPass ? "text" : "password"}
                                placeholder="Enter Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <button
                                type="button"
                                className="eye"
                                onClick={() => setShowPass((v) => !v)}
                                aria-label={showPass ? "Hide password" : "Show password"}
                            >
                                <i
                                    className={`bi ${showPass ? "bi-eye" : "bi-eye-slash"}`}
                                />
                            </button>
                        </div>
                        {/* ERROR MESSAGE BELOW INPUTS */}
                        {errorMsg && (
                            <div className="form-error">
                                {errorMsg}
                            </div>
                        )}

                        <button type="submit" className="login-btn">
                            Login
                        </button>
                    </form>
                </section>
            </main>

            {/* STYLES */}
            <style jsx>{`

            * {
        font-family: "Poppins", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        }

        .login-page {
          min-height: 100vh;
          background: url("/Images/banner2.png") center / cover no-repeat;
          display: grid;
          place-items: center;
          position: relative;
          padding: 20px;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.15);
        }

        .login-card {
          position: relative;
          background: #fff;
          width: 100%;
          max-width: 720px;
          padding: 48px 56px;
          border-radius: 28px;
          text-align: center;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
        }

        .logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 18px;
        }

        .title {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 14px;
          color: #163243;
        }

        .title span {
          color: #f19c38;
        }

        .desc {
          font-size: 18px;
          color: rgba(22, 50, 67, 0.75);
          max-width: 600px;
          margin: 0 auto 28px;
          line-height: 1.6;
        }

        .form {
          display: grid;
          gap: 14px;
          max-width: 420px;
          margin: 0 auto;
        }

        input {
          width: 100%;
          height: 48px;
          border-radius: 999px;
          border: 1.5px solid rgba(22, 50, 67, 0.4);
          padding: 0 18px;
          font-size: 16px;
          outline: none;
        }

        input:focus {
          border-color: #f19c38;
          box-shadow: 0 0 0 4px rgba(241, 156, 56, 0.2);
        }

        .password-wrap {
          position: relative;
        }

        .password-wrap input {
          padding-right: 48px;
        }

        .eye {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
        }

        .eye i {
          font-size: 18px;
          color: rgba(22, 50, 67, 0.65);
        }

        .eye:hover i {
          color: #163243;
        }

        .login-btn {
          margin-top: 6px;
          height: 46px;
          border-radius: 999px;
          border: none;
          background: #163243;
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
        }

        .login-btn:hover {
          opacity: 0.95;
        }

        @media (max-width: 600px) {
          .login-card {
            padding: 32px 22px;
          }

          .title {
            font-size: 28px;
          }

          .desc {
            font-size: 15px;
          }
        }

        .form-error {
        color: #b91c1c;
        font-size: 14px;
        text-align: left;
        margin-top: 4px;
        margin-bottom: 6px;
        padding-left: 6px;
        }

      `}</style>
        </>
    );
}
