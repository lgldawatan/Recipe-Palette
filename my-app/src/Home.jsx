import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Home.css";
import "./index.css";
import Logo2 from "./Assets/api.png";
import Logo1 from "./Assets/logo.png";
import { saveFavorite, removeFavorite } from "./favoritesApi";

export default function Home({ user, savedRecipes = [], setSavedRecipes }) {
  /* ================================
     UI STATE / NAV HELPERS
     ================================ */
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginWarn, setShowLoginWarn] = useState(false);

  const navigate = useNavigate();
  const scrollLockY = useRef(0);

  /* ================================
     MANAGED CONTENT STATE
     ================================ */
  const [managedContent, setManagedContent] = useState({
    bannerText: "DISCOVER TASTE INSPIRATION\n\nExplore a palette of recipes, discover vibrant flavors, and let your kitchen become the canvas for your culinary art. Turn everyday cooking into moments of creativity and delight.",
    addToFavoritesText: "Whether you're trying something new or perfecting a family classic, recipe palette. is your space to learn, create, and celebrate the joy of food. Sign up to save your favorite recipes and build your personal flavor palette.",
  });

  const [aboutUsText, setAboutUsText] = useState("At recipe palette. we believe cooking is more than just making meals—it's an art. Like colors on a canvas, every ingredient adds depth, flavor, and creativity to your kitchen.");

  // Fetch managed home content with real-time listener
  useEffect(() => {
    const db = getFirestore();
    const docRef = doc(db, "config", "homeContent");

    const defaultContent = {
      bannerText: "DISCOVER TASTE INSPIRATION\n\nExplore a palette of recipes, discover vibrant flavors, and let your kitchen become the canvas for your culinary art. Turn everyday cooking into moments of creativity and delight.",
      addToFavoritesText: "Whether you're trying something new or perfecting a family classic, recipe palette. is your space to learn, create, and celebrate the joy of food. Sign up to save your favorite recipes and build your personal flavor palette.",
    };

    console.log("Setting up Firestore listener for home content...");

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const firestoreData = docSnap.data();
          console.log("Firestore data updated:", firestoreData);
          // Merge Firestore data with defaults
          const merged = {
            ...defaultContent,
            ...firestoreData,
          };
          setManagedContent(merged);
        } else {
          console.log("No Firestore document found, using defaults");
          setManagedContent(defaultContent);
        }
      },
      (error) => {
        console.error("Firestore listener error:", error);
        // Fall back to defaults if Firestore is unavailable
        setManagedContent(defaultContent);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log("Cleaning up Firestore listener");
      unsubscribe();
    };
  }, []);

  // Fetch about us text from aboutContent document
  useEffect(() => {
    const db = getFirestore();
    const docRef = doc(db, "config", "aboutContent");

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("About us text updated:", data.aboutUsText);
          setAboutUsText(data.aboutUsText || "At recipe palette. we believe cooking is more than just making meals—it's an art. Like colors on a canvas, every ingredient adds depth, flavor, and creativity to your kitchen.");
        }
      },
      (error) => {
        console.error("Error fetching about us text:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  async function handleLogout() {
    await signOut(auth);
    navigate("/signin", { replace: true });
  }

  /* ================================
     DATA CONFIG
     ================================ */
  const API = "https://www.themealdb.com/api/json/v1/1";
  const CATEGORY = "Chicken";
  const LIMIT = 8;

  /* ================================
     DATA STATE
     ================================ */
  const [meals, setMeals] = useState([]);
  const [status, setStatus] = useState("idle");
  const [detailMeal, setDetailMeal] = useState(null);

  const openMeal = (m) => {
    setDetailMeal(m);
    document.body.classList.add("rp-noscroll");
  };
  const closeMeal = () => {
    setDetailMeal(null);
    document.body.classList.remove("rp-noscroll");
  };

  const dotJoin = (...xs) => xs.filter(Boolean).join(" • ");


  function ingredientSummary(meal, take = 8) {
    const items = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const meas = meal[`strMeasure${i}`];
      if (ing && ing.trim()) items.push(`${(meas || "").trim()} ${ing.trim()}`.trim());
    }
    return items.slice(0, take).join(", ");
  }

  function ingredientItems(m) {
    const out = [];
    for (let i = 1; i <= 20; i++) {
      const name = (m[`strIngredient${i}`] || "").trim();
      const measure = (m[`strMeasure${i}`] || "").trim();
      if (!name) continue;
      const slug = encodeURIComponent(name);
      out.push({
        name,
        measure,
        imgSmall: `https://www.themealdb.com/images/ingredients/${slug}-Small.png`,
        img2x: `https://www.themealdb.com/images/ingredients/${slug}.png`,
      });
    }
    return out;
  }

  function stepsFromText(txt = "") {
    return txt
      .split(/\r?\n+/)
      .map(s =>

        s.replace(/^(?:STEP\s*)?\d+(?:[.)\-:])?\s*/i, "").trim()
      )

      .filter(s => s && !/^(?:STEP\s*)?\d+$/i.test(s));
  }

  /* ================================
     BODY SCROLL-LOCK WHEN MODALS OPEN
     ================================ */
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

  /* ================================
     INITIAL LOAD
     ================================ */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const listRes = await fetch(`${API}/filter.php?c=${encodeURIComponent(CATEGORY)}`);
        const list = await listRes.json();

        const base = (list.meals || []).slice(0, LIMIT);
        const detailJsons = await Promise.all(
          base.map((m) =>
            fetch(`${API}/lookup.php?i=${m.idMeal}`)
              .then((r) => r.json())
              .catch(() => null)
          )
        );
        const data = detailJsons.map((d) => d?.meals?.[0]).filter(Boolean);

        if (!cancelled) {
          setMeals(data);
          setStatus("success");
        }
      } catch {
        if (!cancelled) {
          setMeals([]);
          setStatus("error");
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  /* ================================
     AUTH HELPERS
     ================================ */
  const isAuthed = Boolean(user?.uid);
  const avatar = user?.photoURL || null;
  const displayName = user?.displayName || "Profile";

  const isFav = (id) => savedRecipes?.some((x) => x.idMeal === id);

  const toggleFavorite = async (meal) => {
    if (!isAuthed) {
      setShowLoginWarn(true);
      return;
    }

    const exists = isFav(meal.idMeal);


    setSavedRecipes((prev) =>
      exists
        ? prev.filter((x) => x.idMeal !== meal.idMeal)
        : [...prev, meal]
    );


    try {
      if (exists) {
        await removeFavorite(user, meal.idMeal);
      } else {
        await saveFavorite(user, meal);
      }
    } catch (err) {
      console.error("Favorite sync failed", err);
    }
  };


  const handleFavoritesNav = (e) => {
    if (!isAuthed) {
      e.preventDefault();
      setShowLoginWarn(true);
    }
  };

  /* ================================
     RENDER
     ================================ */
  return (
    <>
      {/* ======================================================
          HEADER 
          ====================================================== */}
      <header className="rp-header">
        <div className="rp-shell">
          {/* Brand / Logo */}
          <Link className="rp-brand" to="/" onClick={() => { setMenuOpen(false); setProfileOpen(false); }}>
            <img className="rp-logo-stack" src={Logo1} alt="Recipe Palette Logo" />
            <span className="rp-wordmark">
              recipe <br />
              palette.
            </span>
          </Link>

          {/* Desktop / tablet right side */}
          <div className="rp-right">
            <nav className="rp-nav" aria-label="Primary">
              <NavLink to="/" end className={({ isActive }) => `rp-link ${isActive ? "rp-link--active" : ""}`}>Home</NavLink>
              <NavLink to="/about" className={({ isActive }) => `rp-link ${isActive ? "rp-link--active" : ""}`}>About</NavLink>
              <NavLink to="/recipes" className={({ isActive }) => `rp-link ${isActive ? "rp-link--active" : ""}`}>Recipes</NavLink>
              <NavLink to="/favorites" onClick={handleFavoritesNav} className={({ isActive }) => `rp-link ${isActive ? "rp-link--active" : ""}`}>Favorites</NavLink>
            </nav>

            {/* Profile button + dropdown (logout) */}
            <div className="rp-profile-wrap">
              <button
                type="button"
                className="rp-profile"
                onClick={() => {
                  if (!isAuthed) { setShowLoginWarn(true); return; }
                  setProfileOpen((o) => !o);
                }}
                aria-label={displayName}
                title={displayName}
              >
                {isAuthed && avatar ? <img className="rp-avatar" src={avatar} alt={displayName} /> : <i className="bi bi-person-circle" />}
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

          {/* Mobile hamburger*/}
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

        {/* Mobile slide-in panel */}
        <div className={`mobile-panel ${menuOpen ? "is-open" : ""}`} id="mobileMenu" role="dialog" aria-modal="true">
          <div className="mobile-panel__head">
            <Link className="rp-brand" to="/" onClick={() => setMenuOpen(false)}>
              <img className="rp-logo-stack" src={Logo1} alt="Recipe Palette Logo" />
              <span className="rp-wordmark">recipe<br />palette.</span>
            </Link>
            <button type="button" className="mobile-panel__close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>×</button>
          </div>

          <nav className="mobile-nav" aria-label="Mobile">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
            <NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink>
            <NavLink to="/recipes" onClick={() => setMenuOpen(false)}>Recipes</NavLink>
            <NavLink to="/favorites" onClick={(e) => { handleFavoritesNav(e); setMenuOpen(false); }}>Favorites</NavLink>

            {!isAuthed ? (
              <NavLink to="/signin" className="mobile-nav__cta" onClick={() => setMenuOpen(false)}>Sign In</NavLink>
            ) : (
              <button className="mobile-nav__cta" onClick={() => { setMenuOpen(false); handleLogout(); }}>Logout</button>
            )}
          </nav>
        </div>

        <button
          className={`nav-overlay ${menuOpen ? "is-open" : ""}`}
          aria-hidden={!menuOpen}
          onClick={() => setMenuOpen(false)}
        />
      </header>

      {/* ======================================================
          MAIN CONTENT
          ====================================================== */}
      <main className="page">
        {/* ---------- HERO ---------- */}
        <section className="hero">
          <div className="hero__bg"></div>
          <div className="hero__content">
            <h1>{managedContent.bannerText.split('\n')[0]}</h1>
            <p className="lead">
              {managedContent.bannerText.split('\n').slice(1).join('\n')}
            </p>
            <Link to="/recipes" className="btn-accent">Discover More</Link>
          </div>
        </section>

        {/* ---------- ABOUT ---------- */}
        <section className="about">
          <div className="about__bg"></div>
          <div className="about__card">
            <h2>About Us</h2>
            <p>
              {aboutUsText}
            </p>
            <Link to="/about" className="btn-about">Learn More</Link>
          </div>
        </section>

        {/* ---------- FEATURED RECIPES ---------- */}
        <section className="recipes">
          <div className="recipes__bar">
            <h2 className="recipes__title">SMART RECIPES. TASTIER MEALS.</h2>
            <Link to="/recipes" className="btn-seeall">See All</Link>
          </div>

          <div className="recipes-grid" id="recipesGrid">
            {status === "loading" && <p style={{ color: "#888" }}>Loading recipes…</p>}
            {status === "error" && <p style={{ color: "#b00" }}>Failed to load recipes.</p>}

            {status === "success" && meals.map((m) => {
              const meta = dotJoin(m.strCategory, m.strArea);
              const summary = ingredientSummary(m);
              return (
                <article className="recipe-card" key={m.idMeal}>
                  <div className="recipe-card__imgwrap">
                    <img className="recipe-card__img" src={m.strMealThumb} alt={m.strMeal} />
                    {/* View details overlay*/}
                    <button
                      type="button"
                      className="recipe-card__overlay"
                      onClick={() => openMeal(m)}
                      aria-label={`View details for ${m.strMeal}`}
                    >
                      <span>View Details</span>
                    </button>

                    {/* Favorite heart*/}
                    <button
                      type="button"
                      className={`r-like-btn ${isFav(m.idMeal) ? "is-active" : ""}`}
                      onClick={() => toggleFavorite(m)}
                      aria-label={isFav(m.idMeal) ? "Remove from favorites" : "Add to favorites"}
                      title={isFav(m.idMeal) ? "Unheart" : "Heart"}
                    >
                      <i className={`bi ${isFav(m.idMeal) ? "bi-heart-fill" : "bi-heart"} r-like`} aria-hidden="true"></i>
                    </button>
                  </div>

                  <div className="recipe-card__body">
                    <div className="recipe-card__meta">{meta}</div>
                    <h3 className="recipe-card__title">{m.strMeal}</h3>
                    <p className="recipe-card__desc">{summary}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ---------- CTA (Sign in to save) ---------- */}
        <section className="cta-fav">
          <div className="cta-fav__bg"></div>
          <div className="cta-fav__card">
            <h3>Add to Favorites</h3>
            <p>
              {managedContent.addToFavoritesText}
            </p>

            {isAuthed ? (
              <button type="button" className="btn-cta is-disabled" disabled>Signed In</button>
            ) : (
              <Link to="/signin" className="btn-cta">Sign In</Link>
            )}
          </div>
        </section>
      </main>

      {/* ======================================================
          FOOTER
          ====================================================== */}
      <footer className="site-footer">
        <div className="footer-top">
          <p className="footer-tagline">
            Your Trusted Companion For Recipes That Inspire And Meals That Matter.
            <br />
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

      {/* ======================================================
          LOGIN-REQUIRED MODAL
          ====================================================== */}
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
            <div className="rp-modal__head">
              <h3 id="needLogin">Sign in required</h3>
            </div>
            <div className="rp-modal__body">
              <p>Sign in first to open the Favorites page or save recipes.</p>
            </div>
            <div className="rp-modal__foot">
              <div className="rp-modal__actions">
                <button className="btn-plain" type="button" onClick={() => setShowLoginWarn(false)}>Cancel</button>
                <Link className="btn-accent" to="/signin">Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========= HOME: RECIPE DETAILS MODAL ========= */}
      {detailMeal && (
        <div
          className="rp-modal is-open recipe-modal"
          aria-hidden="false"
          onClick={(e) => { if (e.target.classList.contains("rp-modal__scrim")) closeMeal(); }}
        >
          <div className="rp-modal__scrim" />
          <div className="rp-modal__panel rp-modal--recipe recipe-modal--simple" role="dialog" aria-modal="true" aria-labelledby="hmTitle">
            <button className="rp-modal__close" aria-label="Close" onClick={closeMeal}>×</button>
            <div className="rmodal__banner"><span>Learn About The Recipe</span></div>
            <div className="rp-modal__body rmodal">
              <h3 id="hmTitle" className="rmodal__name">{detailMeal.strMeal}</h3>

              <div className="rmodal__section">
                <h4 className="rmodal__label">Ingredients</h4>
                <div className="rmodal__chips rmodal__chips--grid">
                  {ingredientItems(detailMeal).map((it, i) => (
                    <figure key={i} className="ing ing--card">
                      <img
                        src={it.imgSmall}
                        srcSet={`${it.imgSmall} 1x, ${it.img2x} 2x`}
                        alt={it.name}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                      <figcaption>
                        <strong className="ing__name">{it.name}</strong>
                        {it.measure && <span className="ing__measure">{it.measure}</span>}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>

              <div className="rmodal__section">
                <h4 className="rmodal__label">Instructions</h4>
                <ul className="rmodal__steps">
                  {stepsFromText(detailMeal.strInstructions).map((s, i) => <li key={i}>{s}</li>)}
                </ul>

                {detailMeal.strYoutube && (
                  <a className="rmodal__yt rmodal__yt--solo" href={detailMeal.strYoutube} target="_blank" rel="noreferrer">
                    Youtube
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
