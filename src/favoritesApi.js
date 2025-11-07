const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:3000";

async function authFetch(user, path, options = {}) {
  const token = user && (await user.getIdToken());

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
