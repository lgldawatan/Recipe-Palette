import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import "./index.css";
import { auth } from "./firebase";
import Home from "./Home";
import Recipes from "./Recipes";
import Favorites from "./Favorites";
import About from "./About";
import Signin from "./Signin";
import { loadFavorites } from "./favoritesApi";


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("Uncaught error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Something went wrong.</h2>
          <p>Check the console for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const [user, setUser] = React.useState(undefined);
  const [savedRecipes, setSavedRecipes] = React.useState([]);


  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return unsub;
  }, []);


  React.useEffect(() => {
    if (!user) {

      setSavedRecipes([]);
      return;
    }

    (async () => {
      try {
        const favs = await loadFavorites(user);
        setSavedRecipes(Array.isArray(favs) ? favs : []);
      } catch (err) {
        console.error("Failed to load favorites:", err);
        setSavedRecipes([]);
      }
    })();
  }, [user]);


  if (user === undefined) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        Loading…
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              user={user}
              savedRecipes={savedRecipes}
              setSavedRecipes={setSavedRecipes}
            />
          }
        />
        <Route
          path="/recipes"
          element={
            <Recipes
              user={user}
              savedRecipes={savedRecipes}
              setSavedRecipes={setSavedRecipes}
            />
          }
        />
        <Route
          path="/favorites"
          element={
            <Favorites
              user={user}
              savedRecipes={savedRecipes}
              setSavedRecipes={setSavedRecipes}
            />
          }
        />
        <Route path="/about" element={<About user={user} />} />
        <Route
          path="/signin"
          element={
            user ? <Navigate to="/" replace /> : <Signin />
          }
        />
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>
);
