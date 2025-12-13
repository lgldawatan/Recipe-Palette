
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Login from "./login";
import Home from "./Home";

function RequireAuth({ user, children }) {
  if (user === undefined) return null; 
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [user, setUser] = useState(undefined); 

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  return (
    <Router>
      <Routes>
        {/* default route -> if logged in go Home, else go Login */}
        <Route
          path="/"
          element={user ? <Home /> : <Navigate to="/login" replace />}
        />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        {/*catch-all */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}
