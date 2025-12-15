"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface AboutContent {
  aboutUsText: string;
  ourStoryText: string;
  ourMissionText: string;
  whatWeOfferText: string;
  ourValuesText: string;
  joinUsText: string;
}

export default function AdminAboutPage() {
  const router = useRouter();
  const messageTimerRef = useRef<number | null>(null);

  const [content, setContent] = useState<AboutContent>({
    aboutUsText: "",
    ourStoryText: "",
    ourMissionText: "",
    whatWeOfferText: "",
    ourValuesText: "",
    joinUsText: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const defaultContent: AboutContent = {
    aboutUsText: "At recipe palette., we believe cooking is more than just making meals. It's an art form. Like colors on a canvas, every ingredient adds depth, flavor, and creativity to your kitchen.",
    ourStoryText: "Recipe Palette was born from the love of food and the belief that every kitchen can be a place of creativity. We wanted to create a space where flavors come together, cultures meet, and everyday meals are transformed into vibrant experiences. Whether you're a beginner in the kitchen or a seasoned cook, our platform is designed to inspire, guide, and celebrate your journey.",
    ourMissionText: "Our mission is to inspire home cooks and food lovers to explore diverse recipes, discover vibrant flavors, and transform simple ingredients into extraordinary dishes. At Recipe Palette, we believe that cooking brings joy, creativity, and connection into everyday life.",
    whatWeOfferText: "Global Recipes – Discover dishes from around the world.\n\nCreative Cooking – Transform everyday meals into colorful creations.\n\nSave Favorites – Log in to build your own personal flavor palette.\n\nStep-by-Step Guides – Clear instructions for beginners and experts alike.",
    ourValuesText: "Creativity – Cooking is a canvas for self-expression.\n\nCommunity – Food tastes better when it's shared.\n\nDiversity – Every culture brings flavors worth celebrating.",
    joinUsText: "At Recipe Palette, we celebrate the joy of food and the art of flavor. Explore new dishes, create your own, and share the stories behind every meal. Because every recipe adds color to your journey — and together, they create a palette worth savoring.",
  };

  // Fetch about content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch("/api/admin/about");
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
        setMessage("Failed to load about content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [router]);

  const handleTextChange = (field: keyof AboutContent, value: string) => {
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log("Saving content:", content);
      const res = await fetch("/api/admin/about", {
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
      setMessage("About content saved successfully!");
      
      // Auto-close success message after 2 seconds
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
      messageTimerRef.current = window.setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (error) {
      console.error("Save error:", error);
      setMessageType("error");
      setMessage(`Failed to save content: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    setSaving(true);
    try {
      // Save default content to Firestore
      const res = await fetch("/api/admin/about", {
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
      setSaving(false);
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
        <h1>Manage About Page Content</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            className="rp-btn-restore"
            onClick={handleRestore}
            disabled={saving}
          >
            {saving ? "Restoring..." : "Restore"}
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
        {/* About Us Section */}
        <EditSection
          title="About Us Text"
          text={content.aboutUsText}
          onTextChange={(text) => handleTextChange("aboutUsText", text)}
        />

        {/* Our Story Section */}
        <EditSection
          title="Our Story"
          text={content.ourStoryText}
          onTextChange={(text) => handleTextChange("ourStoryText", text)}
        />

        {/* Our Mission Section */}
        <EditSection
          title="Our Mission"
          text={content.ourMissionText}
          onTextChange={(text) => handleTextChange("ourMissionText", text)}
        />

        {/* What We Offer Section */}
        <EditSection
          title="What We Offer"
          text={content.whatWeOfferText}
          onTextChange={(text) => handleTextChange("whatWeOfferText", text)}
          isMultiline={true}
        />

        {/* Our Values Section */}
        <EditSection
          title="Our Values"
          text={content.ourValuesText}
          onTextChange={(text) => handleTextChange("ourValuesText", text)}
          isMultiline={true}
        />

        {/* Join Us Section */}
        <EditSection
          title="Join Us Text"
          text={content.joinUsText}
          onTextChange={(text) => handleTextChange("joinUsText", text)}
        />
      </div>

      <style jsx>{`
        .rp-admin-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 0 2rem;
        }

        .rp-admin-page-header h1 {
          font-size: 1.875rem;
          font-weight: 600;
          margin: 0;
          color: #1a202c;
          font-family: Poppins, system-ui, sans-serif;
        }

        .rp-admin-sections {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 0 2rem 2rem 2rem;
          max-width: 1400px;
        }

        .rp-btn-primary,
        .rp-btn-restore {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 500;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: Poppins, system-ui, sans-serif;
        }

        .rp-btn-primary {
          background-color: #4299e1;
          color: white;
        }

        .rp-btn-primary:hover:not(:disabled) {
          background-color: #3182ce;
        }

        .rp-btn-restore {
          background-color: #edf2f7;
          color: #2d3748;
        }

        .rp-btn-restore:hover:not(:disabled) {
          background-color: #e2e8f0;
        }

        .rp-btn-primary:disabled,
        .rp-btn-restore:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .rp-modal {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 9999;
        }

        .rp-modal.is-open {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .rp-modal__scrim {
          position: absolute;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.3);
        }

        .success-card {
          position: relative;
          z-index: 10000;
          background: white;
          border-radius: 0.75rem;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          max-width: 400px;
        }

        .success-icon {
          font-size: 2.5rem;
          color: #48bb78;
        }

        .success-card p {
          margin: 0;
          font-size: 1rem;
          color: #2d3748;
          text-align: center;
          font-family: Poppins, system-ui, sans-serif;
        }

        .rp-admin-message {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          margin-bottom: 1rem;
          border-radius: 0.5rem;
          font-family: Poppins, system-ui, sans-serif;
        }

        .rp-admin-message-error {
          background-color: #fed7d7;
          color: #c53030;
          border-left: 4px solid #c53030;
        }

        .rp-admin-message i {
          font-size: 1.25rem;
        }

        .rp-admin-message-close {
          margin-left: auto;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: inherit;
          padding: 0;
        }
      `}</style>
    </>
  );
}

interface EditSectionProps {
  title: string;
  text: string;
  onTextChange: (text: string) => void;
  isMultiline?: boolean;
}

function EditSection({ title, text, onTextChange, isMultiline }: EditSectionProps) {
  return (
    <div className="edit-section">
      <label className="edit-section__label">{title}</label>
      <textarea
        className="edit-section__input"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        rows={isMultiline ? 12 : 6}
      />
      <style jsx>{`
        .edit-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .edit-section__label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2d3748;
          font-family: Poppins, system-ui, sans-serif;
        }

        .edit-section__input {
          padding: 0.75rem;
          border: 1px solid #cbd5e0;
          border-radius: 0.375rem;
          font-size: 0.9375rem;
          font-family: Poppins, system-ui, sans-serif;
          color: #1a202c;
          resize: vertical;
        }

        .edit-section__input:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }
      `}</style>
    </div>
  );
}
