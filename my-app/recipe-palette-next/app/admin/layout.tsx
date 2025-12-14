"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [openProfile, setOpenProfile] = useState(false);
  const profileWrapRef = useRef<HTMLDivElement | null>(null);
  const [openMobileNav, setOpenMobileNav] = useState(false);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!profileWrapRef.current) return;
      if (!profileWrapRef.current.contains(e.target as Node)) setOpenProfile(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenProfile(false);
        setOpenMobileNav(false);
        document.body.classList.remove("rp-noscroll");
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const isActive = (path: string) => {
    return typeof window !== "undefined" && window.location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="rp-layout-wrapper">
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <header className="rp-header">
        <div className="rp-shell">
          {/* LEFT: logo + wordmark */}
          <button
            className="rp-brand"
            onClick={() => router.push("/admin/recipes")}
            aria-label="Recipe Palette"
            type="button"
          >
            <Image src="/Images/logo.png" alt="Recipe Palette Logo" width={140} height={40} priority />
            <span className="rp-wordmark">
              recipe <br /> palette.
            </span>
          </button>

          {/* CENTER: links */}
          <nav className="rp-nav" aria-label="Admin Navigation">
            <button className={`rp-link ${isActive("/admin/home") ? "rp-link--active" : ""}`} onClick={() => router.push("/admin/home")} type="button">
              Home
            </button>
            <button className={`rp-link ${isActive("/admin/about") ? "rp-link--active" : ""}`} onClick={() => router.push("/admin/about")} type="button">
              About
            </button>
            <button className={`rp-link ${isActive("/admin/recipes") ? "rp-link--active" : ""}`} onClick={() => router.push("/admin/recipes")} type="button">
              Recipes
            </button>
          </nav>

          {/* RIGHT: profile + dropdown */}
          <div className="rp-profileWrap" ref={profileWrapRef}>
            <button
              className="rp-profile"
              type="button"
              aria-label="Profile"
              aria-haspopup="menu"
              aria-expanded={openProfile}
              onClick={() => setOpenProfile((v) => !v)}
            >
              <i className="bi bi-person-circle" />
            </button>

            {openProfile && (
              <div className="rp-profileMenu" role="menu" aria-label="Profile menu">
                <button
                  className="rp-profileItem"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenProfile(false);
                    // TODO: Implement change password modal
                  }}
                >
                  Change Password
                </button>

                <button
                  className="rp-profileItem"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenProfile(false);
                    handleLogout();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            className="rp-menu-btn"
            aria-label="Open menu"
            onClick={() => {
              setOpenMobileNav(true);
              document.body.classList.add("rp-noscroll");
            }}
          >
            <i className="bi bi-list" />
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {openMobileNav && (
        <div className="rp-mobile">
          <div className="rp-mobile-head">
            <div className="rp-mobile-brand">
              <Image src="/Images/logo.png" alt="Recipe Palette" width={42} height={42} />
              <span>
                recipe <br /> palette.
              </span>
            </div>

            <button
              className="rp-mobile-close"
              aria-label="Close menu"
              onClick={() => {
                setOpenMobileNav(false);
                document.body.classList.remove("rp-noscroll");
              }}
            >
              ✕
            </button>
          </div>

          <nav className="rp-mobile-nav">
            <button
              className={isActive("/admin/home") ? "is-active" : ""}
              onClick={() => {
                router.push("/admin/home");
                setOpenMobileNav(false);
                document.body.classList.remove("rp-noscroll");
              }}
            >
              Home
            </button>

            <button
              className={isActive("/admin/about") ? "is-active" : ""}
              onClick={() => {
                router.push("/admin/about");
                setOpenMobileNav(false);
                document.body.classList.remove("rp-noscroll");
              }}
            >
              About
            </button>

            <button
              className={isActive("/admin/recipes") ? "is-active" : ""}
              onClick={() => {
                router.push("/admin/recipes");
                setOpenMobileNav(false);
                document.body.classList.remove("rp-noscroll");
              }}
            >
              Recipes
            </button>

            <button
              onClick={() => {
                setOpenMobileNav(false);
                document.body.classList.remove("rp-noscroll");
                // TODO: Implement change password modal
              }}
            >
              Change Password
            </button>

            <button
              onClick={() => {
                setOpenMobileNav(false);
                document.body.classList.remove("rp-noscroll");
                handleLogout();
              }}
            >
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* Content */}
      <main className="rp-admin-main">
        {children}
      </main>

      <style jsx>{`
        .rp-layout-wrapper {
          min-height: 100vh;
          background-color: #f5f5f5;
        }

        .rp-header {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 14px 16px;
          background: #df861e;
        }

        .rp-shell {
          max-width: 1289px;
          margin: 0 auto;
          background: #fff;
          border-radius: 9999px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }

        /* BRAND */
        .rp-brand {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 230px;
        }

        .rp-wordmark {
          line-height: 1.05;
          font-weight: 800;
          color: #012736ff;
          text-transform: lowercase;
          font-size: 16px;
          text-align: left;
          display: block;
          font-family: "Fredoka", system-ui, sans-serif;
        }

        /* NAV */
        .rp-nav {
          display: flex;
          align-items: center;
          gap: 60px;
          margin-left: auto;
          margin-right: 90px;
        }

        .rp-link {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-size: 17px;
          color: #183f4e;
          padding: 6px 10px;
        }

        .rp-link--active {
          font-weight: 700;
          color: #df861e;
        }

        /* PROFILE + DROPDOWN */
        .rp-profileWrap {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
        }

        .rp-profile {
          width: 60px;
          height: 60px;
          border-radius: 999px;
          background: #fff;
          display: grid;
          place-items: center;
          cursor: pointer;
          border: none;
        }

        .rp-profile i {
          font-size: 40px;
          color: #012736ff;
        }

        .rp-profileMenu {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(35, 35, 35, 0.12);
          border: 1px solid rgba(0, 0, 0, 0.08);
          z-index: 9999;
        }

        .rp-profileItem {
          width: 100%;
          border: 0;
          background: transparent;
          padding: 10px 12px;
          font-size: 16px;
          font-weight: 400;
          color: #1b1b1b;
          text-align: center;
          cursor: pointer;
        }

        .rp-profileItem + .rp-profileItem {
          border-top: 1px solid rgba(0, 0, 0, 0.2);
        }

        .rp-profileItem:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        .rp-menu-btn {
          display: none;
          background: transparent;
          border: none;
          font-size: 24px;
          color: #012736;
          cursor: pointer;
          padding: 8px;
        }

        /* MOBILE NAV */
        .rp-mobile {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 100;
        }

        .rp-mobile-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: #fff;
          border-bottom: 1px solid #e5e5e5;
        }

        .rp-mobile-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: #012736;
        }

        .rp-mobile-close {
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #012736;
        }

        .rp-mobile-nav {
          background: #fff;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .rp-mobile-nav button {
          padding: 12px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #183f4e;
          text-align: left;
          border-radius: 8px;
        }

        .rp-mobile-nav button.is-active {
          background: #f0f0f0;
          color: #df861e;
          font-weight: 700;
        }

        .rp-mobile-nav button:hover {
          background: #f5f5f5;
        }

        .rp-admin-main {
          max-width: 1289px;
          margin: 0 auto;
          padding: 22px;
          width: 95%;
        }

        /* RESPONSIVE */
        @media (max-width: 640px) {
          .rp-shell {
            padding: 10px 14px;
          }

          .rp-nav {
            gap: 22px;
            margin-right: 50px;
          }

          .rp-menu-btn {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
