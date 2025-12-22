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
  const [savingFields, setSavingFields] = useState<Set<keyof AboutContent>>(new Set());
  const [restoringFields, setRestoringFields] = useState<Set<keyof AboutContent>>(new Set());
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

  const handleSaveField = async (field: keyof AboutContent) => {
    setSavingFields((prev) => new Set(prev).add(field));
    try {
      const dataToSave = { [field]: content[field] };
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      if (!res.ok) {
        throw new Error("Save failed");
      }
      setMessageType("success");
      setMessage(`${field} saved successfully!`);
    } catch (error) {
      console.error("Save error:", error);
      setMessageType("error");
      setMessage(`Failed to save ${field}`);
    } finally {
      setSavingFields((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }
  };

  const handleRestoreField = async (field: keyof AboutContent) => {
    setRestoringFields((prev) => new Set(prev).add(field));
    try {
      const dataToSave = { [field]: defaultContent[field] };
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      if (!res.ok) {
        throw new Error("Failed to restore");
      }

      setContent((prev) => ({ ...prev, [field]: defaultContent[field] }));
      setMessageType("success");
      setMessage(`${field} restored to defaults`);
      
     
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
      messageTimerRef.current = window.setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (error) {
      console.error("Restore error:", error);
      setMessageType("error");
      setMessage(`Failed to restore ${field}`);
    } finally {
      setRestoringFields((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
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
          fieldName="aboutUsText"
          text={content.aboutUsText}
          onTextChange={(text) => handleTextChange("aboutUsText", text)}
          onSave={() => handleSaveField("aboutUsText")}
          onRestore={() => handleRestoreField("aboutUsText")}
          isSaving={savingFields.has("aboutUsText")}
          isRestoring={restoringFields.has("aboutUsText")}
        />

        {/* Our Story Section */}
        <EditSection
          title="Our Story"
          fieldName="ourStoryText"
          text={content.ourStoryText}
          onTextChange={(text) => handleTextChange("ourStoryText", text)}
          onSave={() => handleSaveField("ourStoryText")}
          onRestore={() => handleRestoreField("ourStoryText")}
          isSaving={savingFields.has("ourStoryText")}
          isRestoring={restoringFields.has("ourStoryText")}
        />

        {/* Our Mission Section */}
        <EditSection
          title="Our Mission"
          fieldName="ourMissionText"
          text={content.ourMissionText}
          onTextChange={(text) => handleTextChange("ourMissionText", text)}
          onSave={() => handleSaveField("ourMissionText")}
          onRestore={() => handleRestoreField("ourMissionText")}
          isSaving={savingFields.has("ourMissionText")}
          isRestoring={restoringFields.has("ourMissionText")}
        />

        {/* What We Offer Section */}
        <EditSection
          title="What We Offer"
          fieldName="whatWeOfferText"
          text={content.whatWeOfferText}
          onTextChange={(text) => handleTextChange("whatWeOfferText", text)}
          onSave={() => handleSaveField("whatWeOfferText")}
          onRestore={() => handleRestoreField("whatWeOfferText")}
          isSaving={savingFields.has("whatWeOfferText")}
          isRestoring={restoringFields.has("whatWeOfferText")}
          isMultiline={true}
        />

        {/* Our Values Section */}
        <EditSection
          title="Our Values"
          fieldName="ourValuesText"
          text={content.ourValuesText}
          onTextChange={(text) => handleTextChange("ourValuesText", text)}
          onSave={() => handleSaveField("ourValuesText")}
          onRestore={() => handleRestoreField("ourValuesText")}
          isSaving={savingFields.has("ourValuesText")}
          isRestoring={restoringFields.has("ourValuesText")}
          isMultiline={true}
        />

        {/* Join Us Section */}
        <EditSection
          title="Join Us Text"
          fieldName="joinUsText"
          text={content.joinUsText}
          onTextChange={(text) => handleTextChange("joinUsText", text)}
          onSave={() => handleSaveField("joinUsText")}
          onRestore={() => handleRestoreField("joinUsText")}
          isSaving={savingFields.has("joinUsText")}
          isRestoring={restoringFields.has("joinUsText")}
        />
      </div>

      <style jsx>{`
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
          font-weight: 600;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.3s;
          font-family: Poppins, system-ui, sans-serif;
        }

        .rp-btn-primary {
          background-color: #d97706;
          color: white;
        }

        .rp-btn-primary:hover:not(:disabled) {
          background-color: #b85e00;
        }

        .rp-btn-restore {
          background-color: #4CAF50;
          color: white;
        }

        .rp-btn-restore:hover:not(:disabled) {
          background-color: #45a049;
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
  fieldName?: string;
  text: string;
  onTextChange: (text: string) => void;
  onSave?: () => void;
  onRestore?: () => void;
  isSaving?: boolean;
  isRestoring?: boolean;
  isMultiline?: boolean;
}

function EditSection({ 
  title, 
  fieldName,
  text, 
  onTextChange, 
  onSave,
  onRestore,
  isSaving = false,
  isRestoring = false,
  isMultiline 
}: EditSectionProps) {
  return (
    <div className="edit-section">
      <div className="edit-section__header">
        <h3 className="edit-section__title">{title}</h3>
        {onSave && onRestore && (
          <div className="edit-section__actions">
            <button
              className="edit-section__btn edit-section__btn--restore"
              onClick={onRestore}
              disabled={isRestoring}
            >
              {isRestoring ? "Restoring..." : "Restore"}
            </button>
            <button
              className="edit-section__btn edit-section__btn--save"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>
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
          gap: 1rem;
          background-color: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .edit-section__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .edit-section__title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          font-family: Poppins, system-ui, sans-serif;
        }

        .edit-section__actions {
          display: flex;
          gap: 0.75rem;
        }

        .edit-section__input {
          padding: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.95rem;
          font-family: inherit;
          color: #1a202c;
          resize: vertical;
        }

        .edit-section__input::placeholder {
          color: #9ca3af;
        }

        .edit-section__input:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }

        .edit-section__btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: background-color 0.3s;
          white-space: nowrap;
        }

        .edit-section__btn--save {
          background-color: #d97706;
          color: white;
        }

        .edit-section__btn--save:hover:not(:disabled) {
          background-color: #b85e00;
        }

        .edit-section__btn--restore {
          background-color: #4CAF50;
          color: white;
        }

        .edit-section__btn--restore:hover:not(:disabled) {
          background-color: #388e3c;
        }

        .edit-section__btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
