"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface HomeContent {
  bannerText: string;
  aboutUsText: string;
  addToFavoritesText: string;
}

export default function AdminHomePage() {
  const router = useRouter();
  const messageTimerRef = useRef<number | null>(null);

  const [content, setContent] = useState<HomeContent>({
    bannerText: "",
    aboutUsText: "",
    addToFavoritesText: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const defaultContent: HomeContent = {
    bannerText: "DISCOVER TASTE INSPIRATION\n\nExplore a palette of recipes, discover vibrant flavors, and let your kitchen become the canvas for your culinary art. Turn everyday cooking into moments of creativity and delight.",
    aboutUsText: "At recipe palette. we believe cooking is more than just making meals—it's an art. Like colors on a canvas, every ingredient adds depth, flavor, and creativity to your kitchen.",
    addToFavoritesText: "Whether you're trying something new or perfecting a family classic, recipe palette. is your space to learn, create, and celebrate the joy of food. Sign up to save your favorite recipes and build your personal flavor palette.",
  };

  // Fetch home content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch("/api/admin/home");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch content");
        const data = await res.json();
        setContent(data);
      } catch (error) {
        console.error("Error fetching content:", error);
        setMessageType("error");
        setMessage("Failed to load home content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [router]);

  const handleTextChange = (field: keyof HomeContent, value: string) => {
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log("Saving content:", content);
      const res = await fetch("/api/admin/home", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      const responseData = await res.json();
      console.log("Save response:", responseData);

      if (!res.ok) {
        throw new Error(responseData.error || "Save failed");
      }
      setMessageType("success");
      setMessage("Home content saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      setMessageType("error");
      setMessage(`Failed to save content: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      // Save default content to Firestore
      const res = await fetch("/api/admin/home", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultContent),
      });

      if (!res.ok) {
        throw new Error("Failed to restore content");
      }

      setContent(defaultContent);
      setMessageType("success");
      setMessage("Content restored to defaults");
      
      // Auto-close after 2 seconds
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
      messageTimerRef.current = window.setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (error) {
      console.error("Restore error:", error);
      setMessageType("error");
      setMessage(`Failed to restore content: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="rp-admin-page-header">
        <h1>Manage Home Page Content</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            className="rp-btn-restore"
            onClick={handleRestore}
            disabled={restoring}
          >
            {restoring ? "Restoring..." : "Restore"}
          </button>
          <button
            className="rp-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Success Dialog */}
      {message && messageType === "success" && (
        <div className="rp-modal is-open" onClick={() => setMessage("")}>
          <div className="rp-modal__scrim" />
          <div className="success-card" role="alert" onClick={(e) => e.stopPropagation()}>
            <i className="bi bi-check-circle-fill success-icon" />
            <p>{message}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {message && messageType === "error" && (
        <div className={`rp-admin-message rp-admin-message-${messageType}`}>
          <i className="bi bi-exclamation-circle"></i>
          <span>{message}</span>
          <button
            className="rp-admin-message-close"
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}

      {/* Content Sections */}
      <div className="rp-admin-sections">
        {/* Banner Section */}
        <EditSection
          title="Banner Text"
          text={content.bannerText}
          onTextChange={(text) => handleTextChange("bannerText", text)}
        />

        {/* About Us Section */}
        <EditSection
          title="About Us Text"
          text={content.aboutUsText}
          onTextChange={(text) => handleTextChange("aboutUsText", text)}
        />

        {/* Add to Favorites Section */}
        <EditSection
          title="Add To Favorites Text"
          text={content.addToFavoritesText}
          onTextChange={(text) => handleTextChange("addToFavoritesText", text)}
        />
      </div>

      <style jsx>{`
        * {
          font-family: "Poppins", system-ui, -apple-system, sans-serif;
        }

        .rp-admin-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          gap: 1rem;
          padding: 0 2rem;
        }

        .rp-admin-page-header h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .rp-btn-primary {
          padding: 0.75rem 1.5rem;
          background-color: #d97706;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: background-color 0.3s;
        }

        .rp-btn-primary:hover:not(:disabled) {
          background-color: #b85e00;
        }

        .rp-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .rp-btn-restore {
          padding: 0.75rem 1.5rem;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: background-color 0.3s;
        }

        .rp-btn-restore:hover {
          background-color: #45a049;
        }

        .rp-admin-message {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }

        .rp-admin-message-success {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .rp-admin-message-error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .rp-admin-message-close {
          margin-left: auto;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: inherit;
        }

        .rp-admin-sections {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 0 2rem 2rem 2rem;
          max-width: 1400px;
        }

        .rp-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .rp-modal.is-open {
          display: flex;
        }

        .rp-modal__scrim {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.35);
        }

        .success-card {
          position: relative;
          background: #fff;
          border-radius: 18px;
          padding: 28px 32px;
          text-align: center;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
          width: 290px;
          max-width: 90%;
          z-index: 1001;
        }

        .success-icon {
          font-size: 48px;
          color: #16a34a;
          margin-bottom: 12px;
          display: block;
        }

        .success-card p {
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
          color: #1f2937;
        }
      `}</style>
    </>
  );
}

// Edit Section Component
interface EditSectionProps {
  title: string;
  text: string;
  onTextChange: (text: string) => void;
}

function EditSection({
  title,
  text,
  onTextChange,
}: EditSectionProps) {
  return (
    <div className="rp-edit-section">
      <style jsx>{`
        .rp-edit-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background-color: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          font-family: "Poppins", system-ui, -apple-system, sans-serif;
        }

        .rp-section-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .rp-section-textarea {
          width: 100%;
          min-height: 200px;
          padding: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.95rem;
          font-family: inherit;
          resize: vertical;
          color: #1a202c;
        }
        
        .rp-section-textarea::placeholder {
          color: #9ca3af;
        }
      `}</style>

      <h3 className="rp-section-title">{title}</h3>
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        className="rp-section-textarea"
        placeholder="Enter text here..."
      />
    </div>
  );
}
