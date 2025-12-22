import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import "bootstrap-icons/font/bootstrap-icons.css";
import { signOut } from "firebase/auth";
import "./Recipes.css";
import "./index.css";
import Logo1 from "./Assets/logo.png";
import Logo2 from "./Assets/api.png";
import { saveFavorite, removeFavorite } from "./favoritesApi";

export default function Recipes({ user, savedRecipes, setSavedRecipes }) {

  const API = "https://www.themealdb.com/api/json/v1/1";
  const LABEL_ALL = "All Recipes";
  const PER_PAGE = 16;
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const scrollLockY = useRef(0);
  const barRef = useRef(null);
  const crumbsRef = useRef(null);
  const [crumbs, setCrumbs] = useState(LABEL_ALL);
  const [full, setFull] = useState([]);
  const [all, setAll] = useState([]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [customRecipes, setCustomRecipes] = useState({});


  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selCats, setSelCats] = useState(new Set());
  const [selAreas, setSelAreas] = useState(new Set());


  const [detailMeal, setDetailMeal] = useState(null);
  const openMeal = (m) => { setDetailMeal(m); document.body.classList.add("rp-noscroll"); };
  const closeMeal = () => { setDetailMeal(null); document.body.classList.remove("rp-noscroll"); };

  function stepsFromText(txt = "") {
    return txt
      .split(/\r?\n+/)
      .map(s =>

        s.replace(/^(?:STEP\s*)?\d+(?:[.)\-:])?\s*/i, "").trim()
      )

      .filter(s => s && !/^(?:STEP\s*)?\d+$/i.test(s));
  }


  const ingredientItems = (m) => {
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
  };

  const [showLoginWarn, setShowLoginWarn] = useState(false);

  const isAuthed = Boolean(user && user.uid);
  const avatar = user?.photoURL || null;
  const displayName = user?.displayName || "Profile";

  const j = useCallback(async (u) => (await fetch(u)).json(), []);

  const dotJoin = (...xs) => xs.filter(Boolean).join(" • ");

  const ingredientSummary = (m, take = 8) => {
    const items = [];
    for (let i = 1; i <= 20; i++) {
      const ing = m[`strIngredient${i}`];
      const mea = m[`strMeasure${i}`];
      if (ing && ing.trim()) {
        items.push(`${ing.trim()} ${((mea || "").trim())}`.trim());
      }
    }
    return items.slice(0, take).join(", ");
  };

  function updateCrumbsWidth() {
    if (barRef.current && crumbsRef.current) {
      barRef.current.style.setProperty("--crumbs-w", `${crumbsRef.current.offsetWidth}px`);
    }
  }
  useEffect(updateCrumbsWidth, [crumbs]);

  useEffect(() => {
    if (showLoginWarn) {
     
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
  }, [showLoginWarn]);

  const loadAll = useCallback(async () => {
    setStatus("loading");
    setErrMsg("");
    setFull([]);
    setAll([]);
    setPage(1);
    setCrumbs(LABEL_ALL);

    const letters = "abcdefghijklmnopqrstuvwxyz".split("");
    const seen = new Set();
    let accumulated = [];
    let hasShown = false;

    try {
      await Promise.all(
        letters.map(async (l) => {
          const res = await j(`${API}/search.php?f=${l}`);
          const meals = res?.meals || [];
          if (!meals.length) return;

          const fresh = [];
          for (const m of meals) {
            if (!m?.idMeal) continue;
            if (seen.has(m.idMeal)) continue;
            seen.add(m.idMeal);
            fresh.push(m);
          }

          if (!fresh.length) return;

          accumulated = [...accumulated, ...fresh].sort((a, b) =>
            a.strMeal.localeCompare(b.strMeal)
          );

          setFull(accumulated);
          setAll(accumulated);

          if (!hasShown) {
            hasShown = true;
            setStatus("success");
          }
        })
      );

      if (!hasShown) {
        setStatus("success");
        setFull([]);
        setAll([]);
      }
    } catch (err) {
      console.error(err);
      setErrMsg("Failed to load recipes.");
      setFull([]);
      setAll([]);
      setStatus("error");
    }
  }, [API, j, LABEL_ALL]);

 
  const loadCustomRecipes = useCallback(async () => {
    try {
     
      const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:3001";
      const apiUrl = apiBase + "/api/recipes/custom?t=" + Date.now();
      console.log("Fetching from:", apiUrl);
      
      const res = await fetch(apiUrl);
      if (!res.ok) {
        console.error("Failed to fetch custom recipes, status:", res.status);
        return;
      }
      const data = await res.json();
      console.log("Loaded custom recipes - count:", Object.keys(data.recipes || {}).length, "IDs:", Object.keys(data.recipes || {}));
      setCustomRecipes(data.recipes || {});
    } catch (err) {
      console.error("Failed to load custom recipes:", err);
    }
  }, []);

  const convertCustomRecipeFormat = useCallback((recipe) => {
    if (!recipe) return recipe;
    

    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
      const converted = { ...recipe };
      recipe.ingredients.forEach((ing, i) => {
        const index = i + 1;
        converted[`strIngredient${index}`] = ing.name || "";
        converted[`strMeasure${index}`] = ing.measure || "";
      });
     
      for (let i = recipe.ingredients.length + 1; i <= 20; i++) {
        converted[`strIngredient${i}`] = "";
        converted[`strMeasure${i}`] = "";
      }
      return converted;
    }
    return recipe;
  }, []);

  
  const mergeRecipesWithCustom = useCallback((meals) => {
    return meals.map((meal) => {
      const custom = customRecipes[meal.idMeal];
      if (custom) {
        console.log(`Found custom data for ${meal.idMeal}, merging...`, custom);
        const converted = convertCustomRecipeFormat(custom);
        const merged = { ...meal, ...converted };
        console.log(`After merge:`, merged.strMeal, merged.strCategory, merged.strArea);
        return merged;
      }
      return meal;
    });
  }, [customRecipes, convertCustomRecipeFormat]);

  const refreshCustomRecipes = useCallback(async () => {
    await loadCustomRecipes();
  }, [loadCustomRecipes]);

  useEffect(() => {
    (async () => {
      await loadAll();
      await loadCustomRecipes();

      try {
        const cats = await j(`${API}/list.php?c=list`);
        setCategories((cats.meals || []).map(x => x.strCategory).sort());
      } catch { }

      try {
        const ars = await j(`${API}/list.php?a=list`);
        setAreas((ars.meals || []).map(x => x.strArea).sort());
      } catch { }
    })();
  }, [loadAll, loadCustomRecipes, j]);

  
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Polling for custom recipe updates...");
      loadCustomRecipes();
    }, 3000);
    return () => clearInterval(interval);
  }, [loadCustomRecipes]);

  const mergeMeals = (...lists) => {
    const map = new Map();
    lists.flat().forEach((m) => { if (m?.idMeal) map.set(m.idMeal, m); });
    return Array.from(map.values()).sort((a, b) => a.strMeal.localeCompare(b.strMeal));
  };
  const searchByName = async (term) => {
    try { const r = await j(`${API}/search.php?s=${encodeURIComponent(term)}`); return r?.meals || []; }
    catch { return []; }
  };
  const searchByIngredient = async (term) => {
    try {
      const r = await j(`${API}/filter.php?i=${encodeURIComponent(term)}`);
      const ids = (r?.meals || []).map((m) => m.idMeal);
      if (!ids.length) return [];
      const detail = await Promise.all(ids.map((id) => j(`${API}/lookup.php?i=${id}`)));
      return detail.map((d) => d?.meals?.[0]).filter(Boolean);
    } catch { return []; }
  };
  const runSearch = async (term) => {
    const qq = term.trim();
    if (!qq) { await loadAll(); return; }
    setStatus("loading"); setErrMsg("");
    try {
      const [byName, byIng] = await Promise.all([searchByName(qq), searchByIngredient(qq)]);
      const merged = mergeMeals(byName, byIng);
      setFull(merged); setAll(merged);
      setCrumbs(`Search: ${qq}`); setPage(1);
      setStatus("success");
    } catch {
      setErrMsg("Search failed."); setFull([]); setAll([]); setStatus("error");
    }
  };

  const idsFromMeals = (meals) => (meals || []).map((m) => m.idMeal);
  const idsByCategories = async (set) => {
    if (!set.size) return null;
    const arr = Array.from(set);
    const res = await Promise.all(arr.map((c) => j(`${API}/filter.php?c=${encodeURIComponent(c)}`)));
    const out = new Set();
    res.forEach((r) => idsFromMeals(r.meals).forEach((id) => out.add(id)));
    return out;
  };
  const idsByAreas = async (set) => {
    if (!set.size) return null;
    const arr = Array.from(set);
    const res = await Promise.all(arr.map((a) => j(`${API}/filter.php?a=${encodeURIComponent(a)}`)));
    const out = new Set();
    res.forEach((r) => idsFromMeals(r.meals).forEach((id) => out.add(id)));
    return out;
  };
  const intersectSets = (a, b) => {
    if (!a && !b) return null;
    if (!a) return b;
    if (!b) return a;
    const out = new Set();
    for (const v of a) if (b.has(v)) out.add(v);
    return out;
  };

 
  async function applyFilters(selCats, selAreas) {
    if (selCats.size === 0 && selAreas.size === 0) {

      setAll(full.slice()); setPage(1);
      setCrumbs(q.trim() ? `Search: ${q.trim()}` : LABEL_ALL);
      setStatus("success");
      return;
    }
    setStatus("loading"); setErrMsg("");
    try {
      const [byC, byA] = await Promise.all([idsByCategories(selCats), idsByAreas(selAreas)]);
      let ids = intersectSets(byC, byA);


      const baseIds = new Set(full.map((m) => m.idMeal));
      ids = intersectSets(ids, baseIds);


      if (!ids || !ids.size) {
        setAll([]); setPage(1);
        const catTxt = selCats.size ? Array.from(selCats).join(", ") : "Any";
        const areaTxt = selAreas.size ? Array.from(selAreas).join(", ") : "Any";
        setCrumbs(`${catTxt} • ${areaTxt}`);
        setStatus("success");
        return;
      }

      const details = await Promise.all(Array.from(ids).map((id) => j(`${API}/lookup.php?i=${id}`)));
      const out = details
        .map((d) => d?.meals?.[0])
        .filter(Boolean)
        .sort((a, b) => a.strMeal.localeCompare(b.strMeal));

      setAll(out); setPage(1);
      const catTxt = selCats.size ? Array.from(selCats).join(", ") : "Any";
      const areaTxt = selAreas.size ? Array.from(selAreas).join(", ") : "Any";
      setCrumbs(`${catTxt} • ${areaTxt}`);
      setStatus("success");
    } catch {
      setErrMsg("Failed to apply filters."); setAll([]); setStatus("error");
    }
  }


  const pages = Math.ceil(all.length / PER_PAGE) || 0;
  const start = (page - 1) * PER_PAGE;
  const slice = all.slice(start, start + PER_PAGE);


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
      console.error("Failed to update favorite:", err);
    }
  };


  const handleFavoritesNav = (e) => {
    if (!isAuthed) {
      e.preventDefault();
      setShowLoginWarn(true);
    }
  };

  return (
    <>
     
      <header className="rp-header">
        <div className="rp-shell">
          {/* Brand / Logo */}
          <Link
            className="rp-brand"
            to="/"
            onClick={() => { setOpen(false); }}
          >
            <img className="rp-logo-stack" src={Logo1} alt="Recipe Palette Logo" />
            <span className="rp-wordmark">
              recipe <br /> palette.
            </span>
          </Link>

          <div className="rp-right">
        
            <nav className="rp-nav">
              <NavLink to="/" end className={({ isActive }) => `rp-link ${isActive ? "rp-link--active" : ""}`}>Home</NavLink>
              <NavLink to="/about" className={({ isActive }) => `rp-link ${isActive ? "rp-link--active" : ""}`}>About</NavLink>
              <NavLink to="/recipes" className={({ isActive }) => `rp-link ${isActive ? "rp-link--active" : ""}`}>Recipes</NavLink>
              <NavLink to="/favorites" onClick={handleFavoritesNav} className={({ isActive }) => `rp-link ${isActive ? "rp-link--active" : ""}`}>Favorites</NavLink>
            </nav>

          
            <div className="rp-profile-wrap">
              <button
                type="button"
                className="rp-profile"
                onClick={() => {
                  if (!isAuthed) { setShowLoginWarn(true); return; }
                  setOpen((o) => !o);
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
              {isAuthed && open && (
                <div className="rp-dropdown">
                  <button
                    className="rp-dropdown-item"
                    onClick={async () => {
                      await signOut(auth);
                      navigate("/signin", { replace: true });
                    }}
                  >
                    <i className="bi bi-box-arrow-right" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>

       
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
              <button className="mobile-nav__cta" onClick={async () => { setMenuOpen(false); await signOut(auth); navigate("/signin", { replace: true }); }}>Logout</button>
            )}
          </nav>
        </div>

       
        <button
          className={`nav-overlay ${menuOpen ? "is-open" : ""}`}
          aria-hidden={!menuOpen}
          onClick={() => setMenuOpen(false)}
        />
      </header>


     
      <main className="page recipes-page">
        <section className="hero-recipes">
          <div className="hero-wrap">
            <h1 className="hero-title">AUTHENTIC FLAVORS AND<br />CUISINES AT YOUR FINGERTIPS</h1>
            <p className="hero-sub">
              With hundreds of recipes ready to inspire your next meal. Bring people together with
              good food and explore our collection of smart recipes that make every day special.
            </p>

            <form className="hero-search" onSubmit={(e) => { e.preventDefault(); runSearch(q); }}>
              <div className="search-box">
                <i className="bi bi-search" aria-hidden="true"></i>
                <input
                  type="search"
                  name="q"
                  placeholder="Search by dish, ingredient, …"
                  value={q}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQ(v);

                    if (v.trim() === "") runSearch("");
                  }}
                />
              </div>

              <button
                type="button"
                className="filter-btn"
                onClick={() => { setIsOpen(true); document.body.classList.add("rp-noscroll"); }}
                aria-label="Open filters"
              >
                <i className="bi bi-sliders2-vertical" aria-hidden="true"></i>
              </button>
            </form>
          </div>
        </section>

        <section className="r-list">

          <div className="r-bar" ref={barRef}>
            <div className="r-crumbs" ref={crumbsRef}>{crumbs}</div>

            <button
              className="reload-btn"
              aria-label="Reload recipes"
              onClick={async () => {
                setSelCats(new Set()); setSelAreas(new Set());
                await loadAll(); setCrumbs(LABEL_ALL);
              }}
            >
              <i className="bi bi-arrow-clockwise" />
            </button>
          </div>


          <div className={`r-grid ${status === "success" && slice.length === 0 ? "is-empty" : ""}`}>

            {status === "loading" && <p style={{ color: "#777", textAlign: "center", width: "100%" }}>Loading recipes…</p>}


            {status === "error" && (
              <div className="r-empty">
                <i className="bi bi-emoji-frown r-empty__icon" aria-hidden="true"></i>
                <h3 className="r-empty__title">{errMsg || "Something went wrong"}</h3>
                <p className="r-empty__desc">Try reloading.</p>
              </div>
            )}

     
            {status === "success" && slice.length === 0 && (
              <div className="r-empty">
                <i className="bi bi-emoji-frown r-empty__icon" aria-hidden="true"></i>
                <h3 className="r-empty__title">No recipes found</h3>
                <p className="r-empty__desc">Try exploring other categories or cuisine.</p>
              </div>
            )}

            {/* Cards list */}
            {status === "success" && slice.length > 0 && mergeRecipesWithCustom(slice).map((m) => (
              <article className="r-card" key={m.idMeal}>
                <div className="r-card__imgwrap">
                  <img className="r-card__img" src={m.strMealThumb} alt={m.strMeal} />

                  {/* Hover overlay */}
                  <button
                    type="button"
                    className="r-card__overlay"
                    onClick={() => openMeal(m)}
                    aria-label={`View details for ${m.strMeal}`}
                  >
                    <span>View Details</span>
                  </button>

                  {/* Favorite toggle (heart) */}
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

                <div className="r-card__body">
                  <div className="r-meta">{dotJoin(m.strCategory, m.strArea)}</div>
                  <h3 className="r-title">{m.strMeal}</h3>
                  <p className="r-desc">{ingredientSummary(m)}</p>
                </div>
              </article>
            ))}
          </div>

      
          {status === "success" && slice.length > 0 && pages > 1 && (
            <nav className="r-pager" aria-label="Recipe pagination">
              <button className="r-page icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>{"<"}</button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`r-page ${p === page ? "is-active" : ""}`} onClick={() => setPage(p)}>
                  {p}
                </button>
              ))}
              <button className="r-page icon" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>{">"}</button>
            </nav>
          )}
        </section>

        {/* ---------- FILTER MODAL ---------- */}
        {isOpen && (
          <div
            className="rp-modal is-open"
            aria-hidden="false"
            onClick={(e) => {

              if (e.target.classList.contains("rp-modal__scrim")) {
                setIsOpen(false);
                document.body.classList.remove("rp-noscroll");
              }
            }}
          >
            <div className="rp-modal__scrim" />
            <div className="rp-modal__panel" role="dialog" aria-modal="true" aria-labelledby="fltTitle">
              <div className="rp-modal__head"><h3 id="fltTitle">Filters</h3></div>

              <div className="rp-modal__body">
                {/* Category chips */}
                <div className="rp-field">
                  <label className="rp-field__label">Category</label>
                  <div className="chip-list" aria-label="Categories">
                    {categories.map((c) => {
                      const checked = selCats.has(c);
                      return (
                        <label className="chip" key={c}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(selCats);
                              e.target.checked ? next.add(c) : next.delete(c);
                              setSelCats(next);
                            }}
                          />
                          <span>{c}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Cuisine/Area*/}
                <div className="rp-field">
                  <label className="rp-field__label">Cuisine</label>
                  <div className="chip-list" aria-label="Cuisines">
                    {areas.map((a) => {
                      const checked = selAreas.has(a);
                      return (
                        <label className="chip" key={a}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(selAreas);
                              e.target.checked ? next.add(a) : next.delete(a);
                              setSelAreas(next);
                            }}
                          />
                          <span>{a}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>


              <div className="rp-modal__foot">
                <button
                  className={`btn-ghost ${selCats.size + selAreas.size > 0 ? "enabled" : ""}`}
                  type="button"
                  disabled={selCats.size + selAreas.size === 0}
                  onClick={() => { setSelCats(new Set()); setSelAreas(new Set()); setAll(full.slice()); setPage(1); }}
                >
                  Clear all (<span>{selCats.size + selAreas.size}</span>)
                </button>

                <div className="rp-modal__actions">
                  <button
                    className="btn-cancel"
                    type="button"
                    onClick={() => { setIsOpen(false); document.body.classList.remove("rp-noscroll"); }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-apply"
                    type="button"
                    onClick={async () => {
                      await applyFilters(selCats, selAreas);
                      setIsOpen(false);
                      document.body.classList.remove("rp-noscroll");
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>


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
                <Link className="btn-accent" to="/signin">Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========= RECIPE DETAILS MODAL ========= */}
      {detailMeal && (
        (() => {
          let mergedMeal = detailMeal;
          const custom = customRecipes[detailMeal.idMeal];
          if (custom) {
            const converted = convertCustomRecipeFormat(custom);
            mergedMeal = { ...detailMeal, ...converted };
          }

          return (
        <div
          className="rp-modal is-open recipe-modal"
          aria-hidden="false"
          onClick={(e) => {
            if (e.target.classList.contains("rp-modal__scrim")) closeMeal();
          }}
        >
          <div className="rp-modal__scrim" />
          <div className="rp-modal__panel rp-modal--recipe recipe-modal--simple" role="dialog" aria-modal="true" aria-labelledby="rmTitle">
           
            <button className="rp-modal__close" aria-label="Close" onClick={closeMeal}>×</button>

          
            <div className="rmodal__banner">
              <span>Learn About The Recipe</span>
            </div>

            <div className="rp-modal__body rmodal">
           
              <h3 id="rmTitle" className="rmodal__name">{mergedMeal.strMeal}</h3>

              {/* INGREDIENTS */}
              <div className="rmodal__section">
                <h4 className="rmodal__label">Ingredients</h4>

               
                <div className="rmodal__chips rmodal__chips--grid">
                  {ingredientItems(mergedMeal).map((it, i) => (
                    <figure key={i} className="ing ing--card">
                      <img
                        src={it.imgSmall}
                        srcSet={`${it.imgSmall} 1x, ${it.img2x} 2x`}
                        alt={it.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"; 
                        }}
                      />
                      <figcaption>
                        <strong className="ing__name">{it.name}</strong>
                        {it.measure && <span className="ing__measure">{it.measure}</span>}
                      </figcaption>
                    </figure>
                  ))}
                </div>

              </div>

              {/* INSTRUCTIONS */}
              <div className="rmodal__section">
                <h4 className="rmodal__label">Instructions</h4>
                <ul className="rmodal__steps">
                  {stepsFromText(mergedMeal.strInstructions).map((s, i) => <li key={i}>{s}</li>)}
                </ul>

                {mergedMeal.strYoutube && (
                  <a
                    className="rmodal__yt rmodal__yt--solo"
                    href={mergedMeal.strYoutube}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Youtube
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
          );
        })()
      )}
    </>
  );
}
