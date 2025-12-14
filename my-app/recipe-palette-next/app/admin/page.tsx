"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface HomeContent {
  bannerText: string;
  bannerImage: string;
  aboutUsText: string;
  aboutUsImage: string;
  addToFavoritesText: string;
  addToFavoritesImage: string;
}

export default function AdminHomePage() {
  const router = useRouter();
  const fileInputRefs = {
    banner: useRef<HTMLInputElement>(null),
    aboutUs: useRef<HTMLInputElement>(null),
    addToFavorites: useRef<HTMLInputElement>(null),
  };

  const [openProfile, setOpenProfile] = useState(false);
  const profileWrapRef = useRef<HTMLDivElement | null>(null);
  const [openMobileNav, setOpenMobileNav] = useState(false);

  const [content, setContent] = useState<HomeContent>({
    bannerText: "",
    bannerImage: "",
    aboutUsText: "",
    aboutUsImage: "",
    addToFavoritesText: "",
    addToFavoritesImage: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

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

  // Close dropdowns on escape
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenProfile(false);
        document.body.classList.remove("rp-noscroll");
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  // Close profile on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!profileWrapRef.current) return;
      if (!profileWrapRef.current.contains(e.target as Node)) setOpenProfile(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const isActive = (path: string) => {
    return window.location.pathname === path;
  };

  const handleTextChange = (field: keyof HomeContent, value: string) => {
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (
    field: "bannerImage" | "aboutUsImage" | "addToFavoritesImage",
    file: File
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("field", field);

    try {
      const res = await fetch("/api/admin/home/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setContent((prev) => ({ ...prev, [field]: data.url }));
      setMessageType("success");
      setMessage("Image uploaded successfully");
    } catch (error) {
      console.error("Image upload error:", error);
      setMessageType("error");
      setMessage("Failed to upload image");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/home", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      if (!res.ok) throw new Error("Save failed");
      setMessageType("success");
      setMessage("Home content saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      setMessageType("error");
      setMessage("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
    (ref as React.RefObject<HTMLInputElement>).current?.click();
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Navigation Bar */}
      <nav style={navStyles.bar}>
        <div style={navStyles.container}>
          <h1 style={navStyles.title}>Recipe Palette Admin</h1>
          <button
            style={navStyles.mobileMenuBtn}
            onClick={() => setOpenMobileNav(!openMobileNav)}
            className="mobile-only"
          >
            <i className="bi bi-list"></i>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div style={layoutStyles.mainContainer}>
        {/* Sidebar */}
        <aside style={{ ...sidebarStyles.sidebar, display: openMobileNav ? "block" : "none" }}>
          <nav style={sidebarStyles.nav}>
            <a
              href="/admin"
              style={{
                ...sidebarStyles.link,
                ...(isActive("/admin") ? sidebarStyles.linkActive : {}),
              }}
            >
              <i className="bi bi-house"></i> Home
            </a>
            <a
              href="/admin/recipes"
              style={{
                ...sidebarStyles.link,
                ...(isActive("/admin/recipes") ? sidebarStyles.linkActive : {}),
              }}
            >
              <i className="bi bi-book"></i> Recipes
            </a>
          </nav>

          {/* Profile Section */}
          <div ref={profileWrapRef} style={sidebarStyles.profileWrap}>
            <button
              style={sidebarStyles.profileBtn}
              onClick={() => setOpenProfile(!openProfile)}
            >
              <i className="bi bi-person-circle"></i>
              <span>Admin</span>
              <i
                className="bi bi-chevron-down"
                style={{
                  transform: openProfile ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s",
                }}
              ></i>
            </button>
            {openProfile && (
              <div style={sidebarStyles.profileDropdown}>
                <button
                  style={sidebarStyles.dropdownBtn}
                  onClick={() => setOpenProfile(false)}
                >
                  <i className="bi bi-key"></i> Change Password
                </button>
                <button style={sidebarStyles.dropdownBtn} onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <main style={layoutStyles.content}>
          {/* Header */}
          <div style={headerStyles.header}>
            <h2 style={headerStyles.title}>Manage Home Page Content</h2>
            <button
              style={headerStyles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Message */}
          {message && (
            <div
              style={{
                ...messageStyles.message,
                ...(messageType === "success"
                  ? messageStyles.success
                  : messageStyles.error),
              }}
            >
              <i
                className={`bi ${messageType === "success" ? "bi-check-circle" : "bi-exclamation-circle"}`}
              ></i>
              {message}
              <button
                style={messageStyles.closeBtn}
                onClick={() => setMessage("")}
              >
                ×
              </button>
            </div>
          )}

          {/* Content Editor Sections */}
          <div style={editorStyles.container}>
            {/* Banner Text Section */}
            <EditSection
              title="Banner Text"
              text={content.bannerText}
              image={content.bannerImage}
              onTextChange={(text) => handleTextChange("bannerText", text)}
              onImageClick={() => triggerFileInput(fileInputRefs.banner as React.RefObject<HTMLInputElement>)}
              onImageUpload={(file) => handleImageUpload("bannerImage", file)}
              fileInputRef={fileInputRefs.banner as React.RefObject<HTMLInputElement>}
            />

            {/* About Us Section */}
            <EditSection
              title="About Us Text"
              text={content.aboutUsText}
              image={content.aboutUsImage}
              onTextChange={(text) => handleTextChange("aboutUsText", text)}
              onImageClick={() => triggerFileInput(fileInputRefs.aboutUs as React.RefObject<HTMLInputElement>)}
              onImageUpload={(file) => handleImageUpload("aboutUsImage", file)}
              fileInputRef={fileInputRefs.aboutUs as React.RefObject<HTMLInputElement>}
            />

            {/* Add to Favorites Section */}
            <EditSection
              title="Add To Favorites Text"
              text={content.addToFavoritesText}
              image={content.addToFavoritesImage}
              onTextChange={(text) => handleTextChange("addToFavoritesText", text)}
              onImageClick={() => triggerFileInput(fileInputRefs.addToFavorites as React.RefObject<HTMLInputElement>)}
              onImageUpload={(file) => handleImageUpload("addToFavoritesImage", file)}
              fileInputRef={fileInputRefs.addToFavorites as React.RefObject<HTMLInputElement>}
            />
          </div>
        </main>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-only {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}

// Edit Section Component
interface EditSectionProps {
  title: string;
  text: string;
  image: string;
  onTextChange: (text: string) => void;
  onImageClick: () => void;
  onImageUpload: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

function EditSection({
  title,
  text,
  image,
  onTextChange,
  onImageClick,
  onImageUpload,
  fileInputRef,
}: EditSectionProps) {
  return (
    <div style={sectionStyles.section}>
      <div style={sectionStyles.content}>
        <h3 style={sectionStyles.title}>{title}</h3>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          style={sectionStyles.textarea}
          placeholder="Enter text here..."
        />
      </div>
      <div style={sectionStyles.imageSection}>
        <div style={sectionStyles.imagePlaceholder} onClick={onImageClick}>
          {image ? (
            <img
              src={image}
              alt={title}
              style={sectionStyles.image}
            />
          ) : (
            <div style={sectionStyles.placeholderContent}>
              <i className="bi bi-image" style={sectionStyles.imageIcon}></i>
              <p>Click to upload</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onImageUpload(e.target.files[0]);
            }
          }}
        />
      </div>
    </div>
  );
}

// Styles
const navStyles = {
  bar: {
    backgroundColor: "#D97706",
    color: "white",
    padding: "1rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    position: "sticky" as const,
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  mobileMenuBtn: {
    display: "none",
    backgroundColor: "transparent",
    border: "none",
    color: "white",
    fontSize: "1.5rem",
    cursor: "pointer",
  },
};

const layoutStyles = {
  mainContainer: {
    display: "flex",
    maxWidth: "1400px",
    margin: "0 auto",
    gap: "2rem",
    padding: "2rem 1rem",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
};

const sidebarStyles = {
  sidebar: {
    width: "250px",
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    height: "fit-content",
    position: "sticky" as const,
    top: "100px",
  },
  nav: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    marginBottom: "2rem",
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    color: "#333",
    textDecoration: "none",
    borderRadius: "6px",
    transition: "all 0.3s",
    cursor: "pointer",
  },
  linkActive: {
    backgroundColor: "#D97706",
    color: "white",
  },
  profileWrap: {
    paddingTop: "1rem",
    borderTop: "1px solid #e5e7eb",
    position: "relative" as const,
  },
  profileBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  profileDropdown: {
    position: "absolute" as const,
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    marginTop: "0.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    zIndex: 1000,
  },
  dropdownBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    backgroundColor: "transparent",
    border: "none",
    textAlign: "left" as const,
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
};

const headerStyles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    gap: "1rem",
  },
  title: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  saveBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#D97706",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    transition: "background-color 0.3s",
  },
};

const messageStyles = {
  message: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1.5rem",
    fontSize: "0.95rem",
  },
  success: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
  },
  closeBtn: {
    marginLeft: "auto",
    backgroundColor: "transparent",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "inherit",
  },
};

const editorStyles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2rem",
  },
};

const sectionStyles = {
  section: {
    display: "flex",
    gap: "2rem",
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    margin: "0 0 1rem 0",
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#1f2937",
  },
  textarea: {
    width: "100%",
    minHeight: "200px",
    padding: "1rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    resize: "vertical" as const,
  },
  imageSection: {
    width: "300px",
    flexShrink: 0,
  },
  imagePlaceholder: {
    width: "300px",
    height: "300px",
    border: "2px dashed #d1d5db",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    backgroundColor: "#f9fafb",
    transition: "all 0.3s",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  placeholderContent: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.5rem",
    color: "#9ca3af",
    textAlign: "center" as const,
  },
  imageIcon: {
    fontSize: "2.5rem",
  },
};
