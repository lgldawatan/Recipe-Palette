
import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import "./About.css";
/* Assets */
import Logo1 from "./Assets/logo.png";
import Logo2 from "./Assets/api.png";
import aboutBanner from "./Assets/about-banner1.png";
import aboutBanner2 from "./Assets/about-banner2.png";

export default function About({ user }) {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginWarn, setShowLoginWarn] = useState(false);
  const scrollLockY = useRef(0);

  // About content state
  const [aboutContent, setAboutContent] = useState({
    aboutUsText: "At recipe palette., we believe cooking is more than just making meals. It's an art form. Like colors on a canvas, every ingredient adds depth, flavor, and creativity to your kitchen.",
    ourStoryText: "Recipe Palette was born from the love of food and the belief that every kitchen can be a place of creativity. We wanted to create a space where flavors come together, cultures meet, and everyday meals are transformed into vibrant experiences. Whether you're a beginner in the kitchen or a seasoned cook, our platform is designed to inspire, guide, and celebrate your journey.",
    ourMissionText: "Our mission is to inspire home cooks and food lovers to explore diverse recipes, discover vibrant flavors, and transform simple ingredients into extraordinary dishes. At Recipe Palette, we believe that cooking brings joy, creativity, and connection into everyday life.",
    whatWeOfferText: "Global Recipes – Discover dishes from around the world.\n\nCreative Cooking – Transform everyday meals into colorful creations.\n\nSave Favorites – Log in to build your own personal flavor palette.\n\nStep-by-Step Guides – Clear instructions for beginners and experts alike.",
    ourValuesText: "Creativity – Cooking is a canvas for self-expression.\n\nCommunity – Food tastes better when it's shared.\n\nDiversity – Every culture brings flavors worth celebrating.",
    joinUsText: "At Recipe Palette, we celebrate the joy of food and the art of flavor. Explore new dishes, create your own, and share the stories behind every meal. Because every recipe adds color to your journey — and together, they create a palette worth savoring.",
  });

  const isAuthed = Boolean(user?.uid);
  const avatar = user?.photoURL || null;
  const displayName = user?.displayName || "Profile";

  async function handleLogout() {
    await signOut(auth);
    navigate("/signin", { replace: true });
  }

  /* Guard Favorites when logged out */
  const handleFavoritesNav = (e) => {
    if (!isAuthed) {
      e.preventDefault();
      setShowLoginWarn(true);
    }
  };

  // Set up Firestore listener for about content
  useEffect(() => {
    try {
      const db = getFirestore();
      const docRef = doc(db, "config", "aboutContent");
      
      console.log("Setting up Firestore listener for aboutContent...");
      
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          console.log("Firestore listener triggered");
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("About content updated from Firestore:", data);
            setAboutContent((prev) => {
              const updated = { ...prev, ...data };
              console.log("Updated state:", updated);
              return updated;
            });
          } else {
            console.log("About content document does not exist in Firestore");
          }
        },
        (error) => {
          console.error("Error listening to about content:", error);
        }
      );

      console.log("Firestore listener attached, unsubscribe function ready");
      return () => {
        console.log("Cleaning up Firestore listener");
        unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up Firestore listener:", error);
    }
  }, []);

  /* === Body scroll lock while modal OR menu is open === */
  useEffect(() => {
    if (showLoginWarn || menuOpen) {
      scrollLockY.current = window.scrollY || 0;
      document.body.style.top = `-${scrollLockY.current}px`;
      document.body.classList.add("rp-noscroll");
    } else {
      document.body.classList.remove("rp-noscroll");
      document.body.style.top = "";
      window.scrollTo(0, scrollLockY.current);
    }
    return () => {
      document.body.classList.remove("rp-noscroll");
      document.body.style.top = "";
    };
  }, [showLoginWarn, menuOpen]);

  return (
    <>
      {/* ================= HEADER================= */}
      <header className="rp-header">
        <div className="rp-shell">
          {/* Brand */}
          <Link
            className="rp-brand"
            to="/"
            onClick={() => {
              setMenuOpen(false);
              setProfileOpen(false);
            }}
          >
            <img className="rp-logo-stack" src={Logo1} alt="Recipe Palette Logo" />
            <span className="rp-wordmark">
              recipe <br />
              palette.
            </span>
          </Link>

         
          <div className="rp-right">
            <nav className="rp-nav" aria-label="Primary">
              <NavLink to="/" end className={({ isActive }) => `rp-link ${isActive ? "rp-link--active" : ""}`}>Home</NavLink>
              <NavLink to="/about" className={({ isActive }) => `rp-link ${isActive ? "rp-link--active" : ""}`}>About</NavLink>
              <NavLink to="/recipes" className={({ isActive }) => `rp-link ${isActive ? "rp-link--active" : ""}`}>Recipes</NavLink>
              <NavLink to="/favorites" onClick={handleFavoritesNav} className={({ isActive }) => `rp-link ${isActive ? "rp-link--active" : ""}`}>Favorites</NavLink>
            </nav>

            {/* Profile button + dropdown */}
            <div className="rp-profile-wrap">
              <button
                type="button"
                className="rp-profile"
                onClick={() => {
                  if (!isAuthed) { setShowLoginWarn(true); return; }
                  setProfileOpen(o => !o);
                }}
                aria-label={displayName}
                title={displayName}
              >
                {isAuthed && avatar ? (
                  <img className="rp-avatar" src={avatar} alt={displayName} />
                ) : (
                  <i className="bi bi-person-circle" />
                )}
              </button>

              {isAuthed && profileOpen && (
                <div className="rp-dropdown">
                  <button className="rp-dropdown-item" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger (visible ≤900px via CSS) */}
          <button
            type="button"
            className="rp-menu-btn"
            aria-label="Open menu"
            aria-controls="mobileMenu"
            aria-expanded={menuOpen ? "true" : "false"}
            onClick={() => setMenuOpen(v => !v)}
          >
            <i className="bi bi-list"></i>
          </button>
        </div>

        {/* Mobile slide-down white panel*/}
        <div
          className={`mobile-panel ${menuOpen ? "is-open" : ""}`}
          id="mobileMenu"
          role="dialog"
          aria-modal="true"
        >
          <div className="mobile-panel__head">
            <Link className="rp-brand" to="/" onClick={() => setMenuOpen(false)}>
              <img className="rp-logo-stack" src={Logo1} alt="Recipe Palette Logo" />
              <span className="rp-wordmark">recipe<br/>palette.</span>
            </Link>
            <button
              type="button"
              className="mobile-panel__close"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              ×
            </button>
          </div>

          <nav className="mobile-nav" aria-label="Mobile">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
            <NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink>
            <NavLink to="/recipes" onClick={() => setMenuOpen(false)}>Recipes</NavLink>
            <NavLink
              to="/favorites"
              onClick={(e) => { handleFavoritesNav(e); setMenuOpen(false); }}
            >
              Favorites
            </NavLink>

            {!isAuthed ? (
              <NavLink to="/signin" className="mobile-nav__cta" onClick={() => setMenuOpen(false)}>Sign In</NavLink>
            ) : (
              <button className="mobile-nav__cta" onClick={() => { setMenuOpen(false); handleLogout(); }}>Logout</button>
            )}
          </nav>
        </div>

        {/*Scrim is disabled by CSS*/}
        <button
          className={`nav-overlay ${menuOpen ? "is-open" : ""}`}
          aria-hidden={!menuOpen}
          onClick={() => setMenuOpen(false)}
        />
      </header>

      {/* ================= MAIN CONTENT (About page) ================= */}
      <div className="about-wrap">
        <main className="page about-main">
          <section className="about-page">
            <div className="about-sloganRow">
              <h1 className="about-slogan">
                EVERY RECIPE<br />
                IS A COLOR ON<br />
                YOUR PALETTE
              </h1>
              <div className="about-icons">
                <img src={Logo1} alt="Cooking icons" />
              </div>
            </div>

            <div className="about-banner">
              <img className="about-banner__img" src={aboutBanner} alt="" />
              <article className="about-card" role="region" aria-label="About Us">
                <h2>About Us</h2>
                <p>
                  At <strong>recipe palette.</strong>, {aboutContent.aboutUsText.replace("At recipe palette., ", "")}
                </p>
              </article>
            </div>
          </section>

          {/* Info blocks */}
          <section className="about-blocks">
            <div className="info-grid">
              <article className="info-card info--navy">
                <h3>Our Story</h3>
                <p>{aboutContent.ourStoryText}</p>
              </article>
              
              <article className="info-card info--gold">
                <h3>Our Mission</h3>
                <p>{aboutContent.ourMissionText}</p>
              </article>

              <article className="info-card info--orange span-2">
                <h3>What We Offer</h3>
                {aboutContent.whatWeOfferText.split("\n\n").map((item, index) => {
                  const [bold, rest] = item.split(" – ");
                  return <p key={index}><strong>{bold}</strong> – {rest}</p>;
                })}
              </article>

              <article className="info-card info--teal span-2">
                <h3>Our Values</h3>
                {aboutContent.ourValuesText.split("\n\n").map((item, index) => {
                  const [bold, rest] = item.split(" – ");
                  return <p key={index}><strong>{bold}</strong> – {rest}</p>;
                })}
              </article>
            </div>
          </section>

          {/* Join Us banner */}
          <section className="about-cta">
            <img className="about-cta__img" src={aboutBanner2} alt="Colorful dishes background" />
            <article className="about-ctaCard" role="region" aria-label="Join Us">
              <h3>Join Us</h3>
              <p>{aboutContent.joinUsText}</p>
            </article>
          </section>
        </main>

        {/* Footer */}
        <footer className="site-footer">
          <div className="footer-top">
            <p className="footer-tagline">
              Your Trusted Companion For Recipes That Inspire And Meals That Matter.<br />
              Because Every Dish Tells A Story. Cook, Share, And Enjoy With Recipe Palette.
            </p>
            <div className="footer-logos">
              <img src={Logo1} alt="Assets/logo.png" />
              <img src={Logo2} alt="Assets/api.png" />
            </div>
          </div>
          <div className="footer-bottom">
            <p>Copyright © 2025 Recipe Palette All Rights Reserved.</p>
          </div>
        </footer>
      </div>

      {/* ============== Login required modal============== */}
      {showLoginWarn && (
        <div
          className="rp-modal is-open login-modal"
          aria-hidden="false"
          onClick={(e) => {
            if (e.target.classList.contains("rp-modal__scrim")) setShowLoginWarn(false);
          }}
        >
          <div className="rp-modal__scrim" />
          <div className="rp-modal__panel" role="dialog" aria-modal="true" aria-labelledby="needLogin">
            <div className="login-modal__icon" aria-hidden="true">
              <i className="bi bi-exclamation-circle" />
            </div>
            <div className="rp-modal__head"><h3 id="needLogin">Sign in required</h3></div>
            <div className="rp-modal__body">
              <p>Sign in first to open the Favorites page or save recipes.</p>
            </div>
            <div className="rp-modal__foot">
              <div className="rp-modal__actions">
                <button className="btn-plain" type="button" onClick={() => setShowLoginWarn(false)}>Cancel</button>
                <Link className="btn-accent" to="/signin" onClick={() => setShowLoginWarn(false)}>Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
