const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:3001";

async function authFetch(user, path, options = {}) {
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken().catch((e) => {
    console.error("Failed to get ID token:", e);
    return null;
  });

  if (!token) throw new Error("Missing ID token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export function loadFavorites(user) {
  return authFetch(user, "/api/favorites", { method: "GET" });
}

export function saveFavorite(user, meal) {
  return authFetch(user, "/api/favorites", {
    method: "POST",
    body: JSON.stringify({ meal }),
  });
}

export function removeFavorite(user, idMeal) {
  return authFetch(user, "/api/favorites", {
    method: "DELETE",
    body: JSON.stringify({ idMeal }),
  });
}
