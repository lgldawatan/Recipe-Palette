"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Meal = Record<string, any>;


export default function AdminRecipesPage() {
    const router = useRouter();

    const API = "https://www.themealdb.com/api/json/v1/1";
    const LABEL_ALL = "All Recipes";
    const PER_PAGE = 16;

    const barRef = useRef<HTMLDivElement | null>(null);
    const crumbsRef = useRef<HTMLDivElement | null>(null);

    const [openProfile, setOpenProfile] = useState(false);
    const profileWrapRef = useRef<HTMLDivElement | null>(null);

    // ====== change password modal ======
    const [openChangePw, setOpenChangePw] = useState(false);
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [pwLoading, setPwLoading] = useState(false);
    const [pwErr, setPwErr] = useState("");
    const [pwOk, setPwOk] = useState("");
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [openPwSuccess, setOpenPwSuccess] = useState(false);
    const successTimerRef = useRef<number | null>(null);

    const [openMobileNav, setOpenMobileNav] = useState(false);
    const isActive = (path: string) => {
        return window.location.pathname === path;
    };


    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (!profileWrapRef.current) return;
            if (!profileWrapRef.current.contains(e.target as Node)) setOpenProfile(false);
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpenProfile(false);
                setOpenChangePw(false);
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

    // ====== state ======
    const [crumbs, setCrumbs] = useState(LABEL_ALL);
    const [full, setFull] = useState<Meal[]>([]);
    const [all, setAll] = useState<Meal[]>([]);
    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errMsg, setErrMsg] = useState("");

    // filter modal + options
    const [isOpen, setIsOpen] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [areas, setAreas] = useState<string[]>([]);
    const [selCats, setSelCats] = useState<Set<string>>(new Set());
    const [selAreas, setSelAreas] = useState<Set<string>>(new Set());



    const j = useCallback(async (u: string) => (await fetch(u)).json(), []);

    function updateCrumbsWidth() {
        if (barRef.current && crumbsRef.current) {
            barRef.current.style.setProperty("--crumbs-w", `${crumbsRef.current.offsetWidth}px`);
        }
    }
    useEffect(updateCrumbsWidth, [crumbs]);

    // ====== helpers ======
    const dotJoin = (...xs: (string | undefined | null)[]) => xs.filter(Boolean).join(" • ");

    const ingredientSummary = (m: Meal, take = 8) => {
        const items: string[] = [];
        for (let i = 1; i <= 20; i++) {
            const ing = m[`strIngredient${i}`];
            const mea = m[`strMeasure${i}`];
            if (ing && String(ing).trim()) {
                items.push(`${String(ing).trim()} ${String(mea || "").trim()}`.trim());
            }
        }
        return items.slice(0, take).join(", ");
    };

    // ====== load all (A-Z) ======
    const loadAll = useCallback(async () => {
        setStatus("loading");
        setErrMsg("");
        setFull([]);
        setAll([]);
        setPage(1);
        setCrumbs(LABEL_ALL);

        const letters = "abcdefghijklmnopqrstuvwxyz".split("");
        const seen = new Set<string>();
        let accumulated: Meal[] = [];
        let hasShown = false;

        try {
            await Promise.all(
                letters.map(async (l) => {
                    const res = await j(`${API}/search.php?f=${l}`);
                    const meals: Meal[] = res?.meals || [];
                    if (!meals.length) return;

                    const fresh: Meal[] = [];
                    for (const m of meals) {
                        if (!m?.idMeal) continue;
                        if (seen.has(m.idMeal)) continue;
                        seen.add(m.idMeal);
                        fresh.push(m);
                    }
                    if (!fresh.length) return;

                    accumulated = [...accumulated, ...fresh].sort((a, b) =>
                        String(a.strMeal).localeCompare(String(b.strMeal))
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
    }, [API, j]);

    useEffect(() => {
        (async () => {
            await loadAll();

            try {
                const cats = await j(`${API}/list.php?c=list`);
                setCategories((cats.meals || []).map((x: any) => x.strCategory).sort());
            } catch { }

            try {
                const ars = await j(`${API}/list.php?a=list`);
                setAreas((ars.meals || []).map((x: any) => x.strArea).sort());
            } catch { }
        })();
    }, [loadAll, j]);

    // ====== search ======
    const mergeMeals = (...lists: Meal[][]) => {
        const map = new Map<string, Meal>();
        lists.flat().forEach((m) => {
            if (m?.idMeal) map.set(m.idMeal, m);
        });
        return Array.from(map.values()).sort((a, b) =>
            String(a.strMeal).localeCompare(String(b.strMeal))
        );
    };

    const searchByName = async (term: string) => {
        try {
            const r = await j(`${API}/search.php?s=${encodeURIComponent(term)}`);
            return r?.meals || [];
        } catch {
            return [];
        }
    };

    const searchByIngredient = async (term: string) => {
        try {
            const r = await j(`${API}/filter.php?i=${encodeURIComponent(term)}`);
            const ids = (r?.meals || []).map((m: any) => m.idMeal);
            if (!ids.length) return [];
            const detail = await Promise.all(ids.map((id: string) => j(`${API}/lookup.php?i=${id}`)));
            return detail.map((d) => d?.meals?.[0]).filter(Boolean);
        } catch {
            return [];
        }
    };

    const runSearch = async (term: string) => {
        const qq = term.trim();
        if (!qq) {
            await loadAll();
            return;
        }
        setStatus("loading");
        setErrMsg("");
        try {
            const [byName, byIng] = await Promise.all([searchByName(qq), searchByIngredient(qq)]);
            const merged = mergeMeals(byName, byIng);
            setFull(merged);
            setAll(merged);
            setCrumbs(`Search: ${qq}`);
            setPage(1);
            setStatus("success");
        } catch {
            setErrMsg("Search failed.");
            setFull([]);
            setAll([]);
            setStatus("error");
        }
    };

    // ====== filters ======
    const idsFromMeals = (meals: any[]) => (meals || []).map((m) => m.idMeal);

    const idsByCategories = async (set: Set<string>) => {
        if (!set.size) return null as Set<string> | null;
        const arr = Array.from(set);
        const res = await Promise.all(arr.map((c) => j(`${API}/filter.php?c=${encodeURIComponent(c)}`)));
        const out = new Set<string>();
        res.forEach((r) => idsFromMeals(r.meals).forEach((id: string) => out.add(id)));
        return out;
    };

    const idsByAreas = async (set: Set<string>) => {
        if (!set.size) return null as Set<string> | null;
        const arr = Array.from(set);
        const res = await Promise.all(arr.map((a) => j(`${API}/filter.php?a=${encodeURIComponent(a)}`)));
        const out = new Set<string>();
        res.forEach((r) => idsFromMeals(r.meals).forEach((id: string) => out.add(id)));
        return out;
    };

    const intersectSets = (a: Set<string> | null, b: Set<string> | null) => {
        if (!a && !b) return null;
        if (!a) return b;
        if (!b) return a;
        const out = new Set<string>();
        for (const v of a) if (b.has(v)) out.add(v);
        return out;
    };

    async function applyFilters(nextCats: Set<string>, nextAreas: Set<string>) {
        if (nextCats.size === 0 && nextAreas.size === 0) {
            setAll(full.slice());
            setPage(1);
            setCrumbs(q.trim() ? `Search: ${q.trim()}` : LABEL_ALL);
            setStatus("success");
            return;
        }

        setStatus("loading");
        setErrMsg("");
        try {
            const [byC, byA] = await Promise.all([idsByCategories(nextCats), idsByAreas(nextAreas)]);
            let ids = intersectSets(byC, byA);

            const baseIds = new Set(full.map((m) => m.idMeal));
            ids = intersectSets(ids, baseIds);

            if (!ids || !ids.size) {
                setAll([]);
                setPage(1);
                const catTxt = nextCats.size ? Array.from(nextCats).join(", ") : "Any";
                const areaTxt = nextAreas.size ? Array.from(nextAreas).join(", ") : "Any";
                setCrumbs(`${catTxt} • ${areaTxt}`);
                setStatus("success");
                return;
            }

            const details = await Promise.all(Array.from(ids).map((id) => j(`${API}/lookup.php?i=${id}`)));

            const out = details
                .map((d) => d?.meals?.[0])
                .filter(Boolean)
                .sort((a, b) => String(a.strMeal).localeCompare(String(b.strMeal)));

            setAll(out);
            setPage(1);
            const catTxt = nextCats.size ? Array.from(nextCats).join(", ") : "Any";
            const areaTxt = nextAreas.size ? Array.from(nextAreas).join(", ") : "Any";
            setCrumbs(`${catTxt} • ${areaTxt}`);
            setStatus("success");
        } catch {
            setErrMsg("Failed to apply filters.");
            setAll([]);
            setStatus("error");
        }
    }



    // ====== pagination ======
    const pages = Math.ceil(all.length / PER_PAGE) || 0;
    const start = (page - 1) * PER_PAGE;
    const slice = all.slice(start, start + PER_PAGE);

    // ====== open/close change password modal ======
    const openPwModal = () => {
        setOpenProfile(false);
        setPwErr("");
        setPwOk("");
        setNewPw("");
        setConfirmPw("");
        setOpenChangePw(true);
        document.body.classList.add("rp-noscroll");
    };

    const closePwModal = () => {
        setOpenChangePw(false);
        document.body.classList.remove("rp-noscroll");
    };

    // ====== save new password======
    const savePassword = async () => {
        setPwErr("");
        setPwOk("");

        const a = newPw.trim();
        const b = confirmPw.trim();

        if (!a || !b) return setPwErr("Please fill out both fields.");
        if (a.length < 6) return setPwErr("Password must be at least 6 characters.");
        if (a !== b) return setPwErr("Passwords do not match.");

        setPwLoading(true);

        try {
            const res = await fetch("/api/admin/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: "8t0QgdNqKrVqkYqRnzM9rdhoyuB2",
                    newPassword: a,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // SHOW SUCCESS MODAL
            setOpenChangePw(false);
            setOpenPwSuccess(true);

            // auto-close after 5 seconds
            successTimerRef.current = window.setTimeout(() => {
                setOpenPwSuccess(false);
            }, 2000);

        } catch (e: any) {
            setPwErr(e.message || "Failed to update password.");
        } finally {
            setPwLoading(false);
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


            {/* ====== NAVBAR ====== */}
            <header className="rp-header">
                <div className="rp-shell">
                    {/* LEFT: logo + wordmark  */}
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
                        <button className="rp-link" onClick={() => router.push("/admin/home")} type="button">
                            Home
                        </button>
                        <button className="rp-link" onClick={() => router.push("/admin/about")} type="button">
                            About
                        </button>
                        <button className="rp-link rp-link--active" onClick={() => router.push("/admin/recipes")} type="button">
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
                                    onClick={openPwModal}
                                >
                                    Change Password
                                </button>

                                <button
                                    className="rp-profileItem"
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                        setOpenProfile(false);
                                        router.push("/admin/login");
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

            {/* ===== MOBILE NAV OVERLAY ===== */}
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
                            onClick={() => router.push("/admin/home")}
                        >
                            Home
                        </button>

                        <button
                            className={isActive("/admin/about") ? "is-active" : ""}
                            onClick={() => router.push("/admin/about")}
                        >
                            About
                        </button>

                        <button
                            className={isActive("/admin/recipes") ? "is-active" : ""}
                            onClick={() => router.push("/admin/recipes")}
                        >
                            Recipes
                        </button>

                        {/* CHANGE PASSWORD */}
                        <button
                            onClick={() => {
                                setOpenMobileNav(false);
                                document.body.classList.remove("rp-noscroll");
                                openPwModal();
                            }}
                        >
                            Change Password
                        </button>

                        <button
                            onClick={() => {
                                setOpenMobileNav(false);
                                router.push("/admin/login");
                            }}
                        >
                            Logout
                        </button>
                    </nav>

                </div>
            )}


            {/* ====== MAIN ====== */}
            <main className="page recipes-page">
                <section className="hero-search-only">
                    <form
                        className="hero-search"
                        onSubmit={(e) => {
                            e.preventDefault();
                            runSearch(q);
                        }}
                    >
                        <div className="search-box">
                            <i className="bi bi-search" aria-hidden="true" />
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
                            onClick={() => {
                                setIsOpen(true);
                                document.body.classList.add("rp-noscroll");
                            }}
                            aria-label="Open filters"
                        >
                            <i className="bi bi-sliders2-vertical" aria-hidden="true" />
                        </button>
                    </form>
                </section>

                <section className="r-list">
                    <div className="r-bar" ref={barRef}>
                        <div className="r-crumbs" ref={crumbsRef}>
                            {crumbs}
                        </div>

                        <button
                            className="reload-btn"
                            aria-label="Reload recipes"
                            type="button"
                            onClick={async () => {
                                setSelCats(new Set());
                                setSelAreas(new Set());
                                await loadAll();
                                setCrumbs(LABEL_ALL);
                            }}
                        >
                            <i className="bi bi-arrow-clockwise" />
                        </button>
                    </div>

                    <div className={`r-grid ${status === "success" && slice.length === 0 ? "is-empty" : ""}`}>
                        {status === "loading" && (
                            <p style={{ color: "#777", textAlign: "center", width: "100%" }}>Loading recipes…</p>
                        )}

                        {status === "error" && (
                            <div className="r-empty">
                                <i className="bi bi-emoji-frown r-empty__icon" aria-hidden="true" />
                                <h3 className="r-empty__title">{errMsg || "Something went wrong"}</h3>
                                <p className="r-empty__desc">Try reloading.</p>
                            </div>
                        )}

                        {status === "success" && slice.length === 0 && (
                            <div className="r-empty">
                                <i className="bi bi-emoji-frown r-empty__icon" aria-hidden="true" />
                                <h3 className="r-empty__title">No recipes found</h3>
                                <p className="r-empty__desc">Try exploring other categories or cuisine.</p>
                            </div>
                        )}

                        {status === "success" &&
                            slice.length > 0 &&
                            slice.map((m) => (
                                <article className="r-card" key={m.idMeal}>
                                    <div className="r-card__imgwrap">
                                        <img className="r-card__img" src={m.strMealThumb} alt={m.strMeal} />

                                        <button
                                            type="button"
                                            className="r-edit-btn"
                                            onClick={() => alert(`Edit recipe: ${m.idMeal} (next page)`)}
                                            aria-label={`Edit ${m.strMeal}`}
                                            title="Edit"
                                        >
                                            <i className="bi bi-pencil-square" />
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
                            <button
                                className="r-page icon"
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                {"<"}
                            </button>

                            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    className={`r-page ${p === page ? "is-active" : ""}`}
                                    type="button"
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </button>
                            ))}

                            <button
                                className="r-page icon"
                                type="button"
                                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                                disabled={page >= pages}
                            >
                                {">"}
                            </button>
                        </nav>
                    )}
                </section>

                {/* ====== FILTER MODAL ====== */}
                {isOpen && (
                    <div className="rp-modal is-open">
                        <div
                            className="rp-modal__scrim"
                            onClick={() => {
                                setIsOpen(false);
                                document.body.classList.remove("rp-noscroll");
                            }}
                        />

                        <div className="filter-card" role="dialog" aria-modal="true">
                            {/* HEADER */}
                            <div className="filter-head">
                                <h3>Filters</h3>
                            </div>

                            {/* BODY */}
                            <div className="filter-body">
                                {/* CATEGORY */}
                                <div className="filter-section">
                                    <h4>Category</h4>
                                    <div className="chip-grid">
                                        {categories.map((c) => (
                                            <label key={c} className="chip">
                                                <input
                                                    type="checkbox"
                                                    checked={selCats.has(c)}
                                                    onChange={(e) => {
                                                        const next = new Set(selCats);
                                                        e.target.checked ? next.add(c) : next.delete(c);
                                                        setSelCats(next);
                                                    }}
                                                />
                                                <span>{c}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* CUISINE */}
                                <div className="filter-section">
                                    <h4>Cuisine</h4>
                                    <div className="chip-grid">
                                        {areas.map((a) => (
                                            <label key={a} className="chip">
                                                <input
                                                    type="checkbox"
                                                    checked={selAreas.has(a)}
                                                    onChange={(e) => {
                                                        const next = new Set(selAreas);
                                                        e.target.checked ? next.add(a) : next.delete(a);
                                                        setSelAreas(next);
                                                    }}
                                                />
                                                <span>{a}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER */}
                            <div className="filter-foot">
                                <button
                                    className="clear-btn"
                                    disabled={selCats.size + selAreas.size === 0}
                                    onClick={() => {
                                        setSelCats(new Set());
                                        setSelAreas(new Set());
                                    }}
                                >
                                    Clear all ({selCats.size + selAreas.size})
                                </button>

                                <div className="filter-actions">
                                    <button
                                        className="btn-cancel"
                                        onClick={() => {
                                            setIsOpen(false);
                                            document.body.classList.remove("rp-noscroll");
                                        }}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        className="btn-apply"
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

                {/* ====== CHANGE PASSWORD MODAL ====== */}
                {openChangePw && (
                    <div
                        className="rp-modal is-open rp-cpw"
                        aria-hidden="false"
                        onClick={(e) => {
                            const el = e.target as HTMLElement;
                            if (el.classList.contains("rp-modal__scrim")) closePwModal();
                        }}
                    >
                        <div className="rp-modal__scrim" />

                        <div className="cpw-card" role="dialog" aria-modal="true" aria-label="Change Password">
                            <div className="cpw-head">
                                <div className="cpw-ico">!</div>
                                <div className="cpw-title">Change Password</div>
                            </div>

                            <div className="cpw-body">
                                {pwErr && <div className="cpw-msg err">{pwErr}</div>}
                                {pwOk && <div className="cpw-msg ok">{pwOk}</div>}

                                <div className="cpw-field">
                                    <div className="cpw-input">
                                        <input
                                            type={showNewPw ? "text" : "password"}
                                            placeholder="New Password"
                                            value={newPw}
                                            onChange={(e) => setNewPw(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="cpw-eye"
                                            aria-label={showNewPw ? "Hide password" : "Show password"}
                                            onClick={() => setShowNewPw((v) => !v)}
                                        >
                                            <i className={`bi ${showNewPw ? "bi-eye" : "bi-eye-slash"}`} />
                                        </button>

                                    </div>
                                </div>

                                <div className="cpw-field">
                                    <div className="cpw-input">
                                        <input
                                            type={showConfirmPw ? "text" : "password"}
                                            placeholder="Confirm Password"
                                            value={confirmPw}
                                            onChange={(e) => setConfirmPw(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="cpw-eye"
                                            aria-label={showConfirmPw ? "Hide password" : "Show password"}
                                            onClick={() => setShowConfirmPw((v) => !v)}
                                        >
                                            <i className={`bi ${showConfirmPw ? "bi-eye" : "bi-eye-slash"}`} />
                                        </button>

                                    </div>
                                </div>


                                <div className="cpw-actions">
                                    <button type="button" className="cpw-cancel" onClick={closePwModal} disabled={pwLoading}>
                                        Cancel
                                    </button>
                                    <button type="button" className="cpw-save" onClick={savePassword} disabled={pwLoading}>
                                        {pwLoading ? "Saving..." : "Save"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {openPwSuccess && (
                    <div className="rp-modal is-open">
                        <div className="rp-modal__scrim" />

                        <div className="success-card" role="alert">
                            <i className="bi bi-check-circle-fill success-icon" />
                            <p>All changes have been applied successfully</p>
                        </div>
                    </div>
                )}

            </main>

            {/* ====== CSS ====== */}
            <style jsx global>{`
        :root {
          --orange: #b45309;
          --paper: #ffffff;
          --accent: #df861e;
        }

        body {
          margin: 0;
          background: #fff;
          color: #0f2a3f;
           font-family: "Poppins", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        }
        .success-card {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background: #fff;
        border-radius: 18px;
        padding: 28px 32px;
        text-align: center;
        box-shadow: 0 30px 80px rgba(0,0,0,.35);
        width: 290px;        
        max-width: 90%;     
        }

        .success-icon {
        font-size: 48px;
        color: #16a34a;
        margin-bottom: 12px;
        }

        body.rp-noscroll {
          overflow: hidden;
        }

        /* HEADER */
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

        /* Body */
        .recipe-body {
        padding: 22px;
        overflow-y: auto;
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
          color: #183F4E;
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

        /* RESPONSIVE */
        @media (max-width: 640px) {
          .rp-shell {
            padding: 10px 14px;
          }
          .rp-nav {
            gap: 22px;
          }
        }

        /* PAGE */
        .page {
          width: 95%;
          max-width: 1289px;
          margin: 18px auto 56px;
        }

        /* search row */
        .hero-search-only {
          margin: 45px auto 8px;
          display: flex;
          justify-content: center;
        }
        .hero-search {
          display: flex;
          gap: 10px;
          width: 100%;
          max-width: 520px;
          justify-content: center;
        }
        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: var(--paper);
          border-radius: 15px;
          border: 1px solid #5e5e5eff;
        }
        .search-box i {
          font-size: 18px;
          color: #1e1e1eff;
        }
        .search-box input {
          border: 0;
          outline: 0;
          width: 100%;
          color: #091017ff;
          font-size: 16px;
        }
        .filter-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 52px;
          height: 52px;
          border-radius: 15px;
          background: #fff;
          color: #565656;
          border: 1px solid #5e5e5eff;
          cursor: pointer;
          font-size: 20px;
        }

        /* crumbs bar */
        .r-list {
          margin-top: 18px;
        }
        .r-bar {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0 12px;
          border-bottom: 1px solid #dcdcdc;
          margin-bottom: 16px;
        }
        .r-bar::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -1px;
          height: 3px;
          width: var(--crumbs-w, 120px);
          background: var(--accent);
        }
        .r-crumbs {
          color: var(--accent);
          font-size: 18px;
          font-weight: 600;
          white-space: nowrap;
        }
        .reload-btn {
          background: none;
          border: none;
          color: var(--accent);
          font-size: 30px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: transform 0.2s ease;
        }
        .reload-btn:hover {
          transform: rotate(90deg);
        }

        /* grid/cards */
        .r-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(270px, 1fr));
        gap: 20px;
        }


        @media (max-width: 1100px) {
          .r-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 820px) {
          .r-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 520px) {
          .r-grid {
            grid-template-columns: 1fr;
          }
        }

        .r-card {
          background: #fff;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.082);
        }
        .r-card__imgwrap {
          position: relative;
          overflow: hidden;
        }
        .r-card__img {
          width: 100%;
          height: 190px;
          object-fit: cover;
          display: block;
        }
        .r-card__body {
          padding: 12px 14px 16px;
        }
        .r-meta {
          color: var(--accent);
          font-size: 13px;
          margin-bottom: 6px;
        }
        .r-title {
          margin: 0 0 8px;
          font-size: 18px;
          color: #0f2a3f;
          font-weight: 700;
        }
        .r-desc {
          margin: 0;
          color: #565656;
          font-size: 15px;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          overflow: hidden;
        }

        .r-card__overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.45);
          color: #fff;
          font: 700 18px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          border: 0;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.18s ease;
        }
        .r-card__imgwrap:hover .r-card__overlay {
          opacity: 1;
        }

        .r-edit-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.9);
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .r-edit-btn i {
          font-size: 16px;
          color: var(--orange);
        }

        /* modal */
        .rp-modal {
          position: fixed;
          inset: 0;
          display: none;
          z-index: 9999;
        }
        .rp-modal.is-open {
          display: block;
        }
        .rp-modal__scrim {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
        }

        /* ===== Change Password Modal ===== */
        .cpw-card {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: min(420px, 92vw);
          border-radius: 18px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
        }

        .cpw-head {
          background: var(--orange);
          color: #fff;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cpw-ico {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.9);
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 18px;
          line-height: 1;
        }

        .cpw-title {
          font-size: 20px;
          font-weight: 700;
        }

        .cpw-body {
          padding: 20px;
          background: #fff;
        }

        .cpw-msg {
          margin-bottom: 12px;
          font-size: 14px;
          padding: 10px 12px;
          border-radius: 12px;
        }
        .cpw-msg.err {
          background: rgba(220, 38, 38, 0.08);
          color: #b91c1c;
          border: 1px solid rgba(220, 38, 38, 0.2);
        }
        .cpw-msg.ok {
          background: rgba(22, 163, 74, 0.08);
          color: #166534;
          border: 1px solid rgba(22, 163, 74, 0.2);
        }

        .cpw-field {
          margin: 14px 0;
        }

        .cpw-field input {
          width: 100%;
          height: 54px;
          border-radius: 999px;
          border: 1.5px solid rgba(0, 0, 0, 0.35);
          padding: 0 18px;
          font-size: 16px;
          outline: none;
        }

        .cpw-actions {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          margin-top: 18px;
        }

        .cpw-cancel,
        .cpw-save {
          height: 46px;
          border-radius: 999px;
          font-size: 16px;
          cursor: pointer;
          padding: 0 22px;
          flex: 1;
        }

        .cpw-cancel {
          background: #fff;
          border: 1.5px solid rgba(105, 105, 105, 0.6);
          color: #111;
           font-weight: 600;
            transition: transform .5s ease
        }

        .cpw-save {
          background: #f4b400;
          border: 0;
          color: #111;
          font-weight: 600;
            transition: transform .5s ease
        }

        
        .cpw-cancel:disabled,
        .cpw-save:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .cpw-cancel:hover{
        transform: translateY(-1px);
        background: rgba(224, 224, 224, 0.27);
        }

        .cpw-save:hover{
        transform: translateY(-1px);
        background: #EEAF0E;
        }
                .cpw-input{
        position: relative;
        width: 100%;
        }

        .cpw-input input{
        width: 100%;
        height: 54px;
        border-radius: 999px;
        border: 1.5px solid rgba(0,0,0,0.35);
        padding: 0 52px 0 18px; 
        font-size: 16px;
        outline: none;
        }

        .cpw-eye{
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        border: 0;
        background: transparent;
        cursor: pointer;
        padding: 6px;
        display: grid;
        place-items: center;
        color: rgba(0,0,0,0.55);
        }

        .cpw-eye i{
        font-size: 18px;
        }

        .cpw-eye:hover{
        color: rgba(0,0,0,0.8);
        }
        /* Pagination container */
        .r-pager {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        margin-top: 32px;
        flex-wrap: wrap;
        }

        /* Page numbers area */
        .r-pages {
        display: flex;
        flex-wrap: wrap;                
        justify-content: center;
        gap: 12px;
        max-width: 100%;                
        }

        /* Individual page */
        .r-page {
        min-width: 36px;
        height: 36px;
        border-radius: 10px;
        background: #fff;
        font-size: 14px;
        cursor: pointer;
        display: grid;
        place-items: center;
        color: #222;
        }

        /* Active page (orange pill) */
        .r-page.is-active {
        background: #df861e;
        color: #fff;
        border-color: #df861e;
        font-weight: 700;
        }

        /* Arrow buttons */
        .r-page.icon {
        font-size: 18px;
        }

        /* Disabled arrows */
        .r-page:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        }

        /* Hover */
        .r-page:hover:not(.is-active):not(:disabled) {
        background: rgba(0,0,0,0.06);
        }

        /* ===== FILTER MODAL ===== */
        .filter-card {
        position: fixed;
        inset: 0;
        margin: auto;
        width: min(570px, 92vw);
        height: min(520px, 90vh);
        background: #fff;
        border-radius: 18px;
        box-shadow: 0 30px 80px rgba(0,0,0,.35);
        display: flex;
        flex-direction: column;
        }

        /* Header */
        .filter-head {
        padding: 18px 22px;
        border-bottom: 1px solid #e5e5e5;
        }
        .filter-head h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        }

        /* Scrollable body */
        .filter-body {
        padding: 20px 22px;
        overflow-y: auto;
        flex: 1;
        }

        /* Sections */
        .filter-section {
        margin-bottom: 24px;
        }
        .filter-section h4 {
        margin-bottom: 12px;
        font-size: 16px;
        font-weight: 600;
        }

        /* Chip layout */
        .chip-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        }

        /* Chip */
        .chip {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border: 1px solid #dcdcdc;
        border-radius: 14px;
        cursor: pointer;
        background: #fff;
        font-size: 14px;
        }

        .chip input {
        width: 16px;
        height: 16px;
        }

        .chip:hover {
        background: rgba(0,0,0,0.04);
        }

        /* Footer */
        .filter-foot {
        padding: 16px 22px;
        border-top: 1px solid #e5e5e5;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        }

        /* Clear */
        .clear-btn {
        border: none;
        background: transparent;
        font-size: 14px;
        color: #999;
        }
        .clear-btn:disabled {
        opacity: 0.5;
        }

        /* Actions */
        .filter-actions {
        display: flex;
        gap: 12px;
        }

        .filter-actions .btn-cancel {
        padding: 8px 20px;
        border-radius: 999px;
        border: 1px solid #ccc;
        background: #fff;
        font-weight: 500;
        }

        .filter-actions .btn-apply {
        padding: 8px 22px;
        border-radius: 999px;
        background: #df861e;
        border: none;
        color: #fff;
        font-weight: 600;
        }
        /* ===== EMPTY STATE ===== */
        .r-empty {
        grid-column: 1 / -1;            
        min-height: 320px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: #6b7280;
        padding: 40px 16px;
        }

        .r-empty__icon {
        font-size: 42px;
        color: #f59e0b;                
        margin-bottom: 14px;
        }

        .r-empty__title {
        margin: 0 0 6px;
        font-size: 20px;
        font-weight: 600;
        color: #111827;
        }

        .r-empty__desc {
        margin: 0;
        font-size: 15px;
        max-width: 360px;
        line-height: 1.5;
        color: #6b7280;
        }





        /* ===== MOBILE NAV ===== */
.rp-menu-btn {
  display: none;
  background: transparent;
  border: 0;
  font-size: 34px;
  color: #012736;
  cursor: pointer;
}

@media (max-width: 768px) {
  .rp-nav {
    display: none;
  }

  .rp-profileWrap {
    display: none; 
  }

  .rp-menu-btn {
    display: block;
  }

  .rp-brand {
    position: static;
    transform: none;
  }

  .rp-header {
    padding: 10px 12px;
  }

  .rp-shell {
    padding: 8px 14px;
    min-height: 56px;
  }

  /* Brand (logo + text) */
  .rp-brand {
    gap: 8px;
    min-width: unset;
  }

  .rp-brand img {
    width: 90px;
    height: auto;
  }

  .rp-wordmark {
    font-size: 14px;
    line-height: 1.05;
  }

  /* Hamburger button */
  .rp-menu-btn {
    font-size: 26px;  
  }

}

.rp-mobile {
  position: fixed;
  top: 0;        
  left: 0;
  right: 0;
  background: #fff;
  z-index: 99999;
  box-shadow: 0 20px 45px rgba(0,0,0,0.2);
  max-height: 85vh;         
  overflow-y: auto;

  animation: slideDown 0.25s ease;
}

/* Slide animation */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header */
.rp-mobile-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
}

.rp-mobile-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 15px;
  color: #012736;
  line-height: 1.1;
}

.rp-mobile-close {
  font-size: 24px;
  background: transparent;
  border: 0;
  cursor: pointer;
}

/* Nav list */
.rp-mobile-nav {
  display: flex;
  flex-direction: column;
}

/* Nav item */
.rp-mobile-nav button {
  width: 100%;
  padding: 15px 5px;  
  text-align: center;
  background: #fff;
  border: 0;
  border-bottom: 1px solid #e5e5e5;
  font-size: 15px;     
  font-weight: 500;
  color: #012736;
  cursor: pointer;
}


/* Active item (orange bar style) */
.rp-mobile-nav button.is-active {
  background: #df861e;
  color: #fff;
  font-weight: 700;
}

/* Hover */
.rp-mobile-nav button:not(.is-active):hover {
  background: rgba(0, 0, 0, 0.04);
}


  .rp-mobile-brand img {
    width: 100%;         
    height: 20px;
    
  }

@media (max-width: 768px) {

  /* Search row spacing */
  .hero-search-only {
    margin: 26px auto 6px;
  }

  .hero-search {
    gap: 8px;
    max-width: 100%;
  }

  /* Search box */
  .search-box {
    padding: 8px 12px;     
    border-radius: 12px;
  }

  .search-box i {
    font-size: 16px;      
  }

  .search-box input {
    font-size: 14px;        
  }

  /* Filter button */
  .filter-btn {
    min-width: 44px;
    height: 44px;           
    border-radius: 12px;
    font-size: 18px;        
  }

}

@media (max-width: 768px) {

  
  .filter-card,
  .filter-body {
    overflow-x: hidden;
  }

  
  .filter-body .chip-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr)); 
    gap: 10px;
    width: 100%;
  }


  .filter-body .chip {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    white-space: nowrap;      
    overflow: hidden;
    text-overflow: ellipsis;  
  }



            `}</style>
        </>
    );
}
