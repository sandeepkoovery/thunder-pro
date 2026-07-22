import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Settings, X, Sun, Moon, Monitor, RotateCcw } from "lucide-react";

const COLOR_PRESETS = [
  {
    id: "blue",
    label: "Blue",
    primary: "#1e88e5",
    primaryDark: "#1565c0",
    primarySoft: "rgba(30, 136, 229, 0.12)",
    swatch: "linear-gradient(135deg, #1e88e5, #1565c0)",
  },
  {
    id: "teal",
    label: "Teal",
    primary: "#009688",
    primaryDark: "#00796b",
    primarySoft: "rgba(0, 150, 136, 0.12)",
    swatch: "linear-gradient(135deg, #009688, #00796b)",
  },
  {
    id: "purple",
    label: "Purple",
    primary: "#7460ee",
    primaryDark: "#5e45d6",
    primarySoft: "rgba(116, 96, 238, 0.12)",
    swatch: "linear-gradient(135deg, #7460ee, #5e45d6)",
  },
  {
    id: "green",
    label: "Green",
    primary: "#21c1d6",
    primaryDark: "#17a2b8",
    primarySoft: "rgba(33, 193, 214, 0.12)",
    swatch: "linear-gradient(135deg, #21c1d6, #17a2b8)",
  },
  {
    id: "cyan",
    label: "Cyan",
    primary: "#2196f3",
    primaryDark: "#1976d2",
    primarySoft: "rgba(33, 150, 243, 0.12)",
    swatch: "linear-gradient(135deg, #2196f3, #1976d2)",
  },
  {
    id: "orange",
    label: "Orange",
    primary: "#ff5722",
    primaryDark: "#e64a19",
    primarySoft: "rgba(255, 87, 34, 0.12)",
    swatch: "linear-gradient(135deg, #ff5722, #e64a19)",
  },
];

const THEME_MODES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

function applyColorPreset(preset) {
  const root = document.documentElement;
  root.style.setProperty("--theme-primary", preset.primary);
  root.style.setProperty("--theme-primary-dark", preset.primaryDark);
  root.style.setProperty("--theme-primary-soft", preset.primarySoft);
  root.style.setProperty("--theme-sidebar-icon", preset.primary);
}

function applyThemeMode(mode) {
  const root = document.documentElement;
  let effectiveMode = mode;

  if (mode === "system") {
    effectiveMode = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  if (effectiveMode === "dark") {
    root.classList.add("dark-theme");
  } else {
    root.classList.remove("dark-theme");
  }
}

export default function ThemeCustomizer({ isOpen: controlledIsOpen, setIsOpen: controlledSetIsOpen }) {
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : localIsOpen;
  const setIsOpen = controlledSetIsOpen !== undefined ? controlledSetIsOpen : setLocalIsOpen;
  const [selectedColor, setSelectedColor] = useState("blue");
  const [themeMode, setThemeMode] = useState("light");
  const panelRef = useRef(null);

  // Load saved settings on mount
  useEffect(() => {
    const savedColor = localStorage.getItem("tp-color-preset") || "blue";
    const savedTheme = localStorage.getItem("tp-theme-mode") || "light";
    setSelectedColor(savedColor);
    setThemeMode(savedTheme);

    const preset = COLOR_PRESETS.find((p) => p.id === savedColor);
    if (preset) applyColorPreset(preset);
    applyThemeMode(savedTheme);

    // Listen for system theme changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (localStorage.getItem("tp-theme-mode") === "system") {
        applyThemeMode("system");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleColorChange = useCallback((presetId) => {
    setSelectedColor(presetId);
    localStorage.setItem("tp-color-preset", presetId);
    const preset = COLOR_PRESETS.find((p) => p.id === presetId);
    if (preset) applyColorPreset(preset);
  }, []);

  const handleThemeChange = useCallback((mode) => {
    setThemeMode(mode);
    localStorage.setItem("tp-theme-mode", mode);
    applyThemeMode(mode);
  }, []);

  const handleReset = useCallback(() => {
    handleColorChange("blue");
    handleThemeChange("light");
  }, [handleColorChange, handleThemeChange]);

  const customizerContent = (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="tp-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* Customizer Panel */}
      <div
        ref={panelRef}
        className={`tp-panel${isOpen ? " tp-panel-open" : ""}`}
      >
        {/* Header */}
        <div className="tp-header">
          <div>
            <h3 className="tp-title">Template Customizer</h3>
            <p className="tp-subtitle">Customize and preview in real time</p>
          </div>
          <div className="tp-header-actions">
            <button
              className="tp-icon-btn"
              onClick={handleReset}
              title="Reset to defaults"
            >
              <RotateCcw size={18} />
            </button>
            <button
              className="tp-icon-btn"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="tp-body">
          {/* Tab Indicator */}
          <div className="tp-tab-indicator">
            <span className="tp-tab-active">Theming</span>
          </div>

          {/* Primary Color */}
          <div className="tp-section">
            <h4 className="tp-section-title">Primary Color</h4>
            <div className="tp-color-grid">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className={`tp-color-swatch${selectedColor === preset.id ? " tp-color-active" : ""}`}
                  onClick={() => handleColorChange(preset.id)}
                  title={preset.label}
                  aria-label={`Select ${preset.label} color`}
                >
                  <span
                    className="tp-swatch-inner"
                    style={{ background: preset.swatch }}
                  />
                  {selectedColor === preset.id && (
                    <svg
                      className="tp-check"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Mode */}
          <div className="tp-section">
            <h4 className="tp-section-title">Theme</h4>
            <div className="tp-theme-grid">
              {THEME_MODES.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    className={`tp-theme-btn${themeMode === mode.id ? " tp-theme-active" : ""}`}
                    onClick={() => handleThemeChange(mode.id)}
                  >
                    <Icon size={24} strokeWidth={1.5} />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Floating Gear Button */}
      {controlledIsOpen === undefined && (
        <button
          className="tp-fab"
          onClick={() => setIsOpen(true)}
          title="Customize Theme"
          aria-label="Open theme customizer"
        >
          <Settings size={22} className="tp-fab-icon" />
        </button>
      )}

      {typeof document !== 'undefined' ? createPortal(customizerContent, document.body) : null}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ── Theme Customizer Fab ── */
        .tp-fab {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 999;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: none;
          background: var(--theme-primary);
          color: #fff;
          box-shadow: 0 4px 18px rgba(30, 136, 229, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .tp-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 24px rgba(30, 136, 229, 0.5);
        }
        .tp-fab-icon {
          animation: tp-spin 4s linear infinite;
        }
        @keyframes tp-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ── Overlay ── */
        .tp-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.25);
          animation: tp-fadeIn 0.2s ease;
        }

        /* ── Panel ── */
        .tp-panel {
          position: fixed;
          top: 0;
          right: -360px;
          z-index: 1001;
          width: 340px;
          max-width: 100%;
          height: 100vh;
          background: #ffffff;
          box-shadow: -8px 0 30px rgba(0, 0, 0, 0.12);
          transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'Poppins', sans-serif !important;
        }
        .dark-theme .tp-panel {
          background: #1e293b;
        }
        .tp-panel-open {
          right: 0;
        }

        /* ── Header ── */
        .tp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          border-bottom: 1px solid #eef2f7;
        }
        .dark-theme .tp-header {
          border-bottom-color: #334155;
        }
        .tp-title {
          font-size: 16px !important;
          font-weight: 600 !important;
          color: #1e293b !important;
          margin: 0 0 2px !important;
        }
        .dark-theme .tp-title {
          color: #f1f5f9 !important;
        }
        .tp-subtitle {
          font-size: 12px !important;
          font-weight: 400 !important;
          color: #94a3b8 !important;
          margin: 0 !important;
        }
        .tp-header-actions {
          display: flex;
          gap: 6px;
        }
        .tp-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tp-icon-btn:hover {
          background: #f1f5f9;
          color: var(--theme-primary);
        }
        .dark-theme .tp-icon-btn:hover {
          background: #334155;
          color: var(--theme-primary);
        }

        /* ── Body ── */
        .tp-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px 32px;
        }

        /* ── Tab Indicator ── */
        .tp-tab-indicator {
          margin-bottom: 24px;
        }
        .tp-tab-active {
          display: inline-block;
          padding: 6px 20px;
          background: rgba(30, 136, 229, 0.08);
          color: var(--theme-primary);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid var(--theme-primary);
        }

        /* ── Section ── */
        .tp-section {
          margin-bottom: 28px;
        }
        .tp-section-title {
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #334155 !important;
          margin: 0 0 14px !important;
        }
        .dark-theme .tp-section-title {
          color: #e2e8f0 !important;
        }

        /* ── Color Grid ── */
        .tp-color-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
        }
        .tp-color-swatch {
          position: relative;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: 2px solid transparent;
          background: transparent;
          padding: 3px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tp-color-swatch:hover {
          transform: scale(1.12);
        }
        .tp-color-active {
          border-color: var(--theme-primary);
          box-shadow: 0 2px 10px rgba(30, 136, 229, 0.25);
        }
        .tp-swatch-inner {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 7px;
        }
        .tp-check {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 18px;
          height: 18px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        }

        /* ── Theme Grid ── */
        .tp-theme-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .tp-theme-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 12px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          background: #ffffff;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 12px;
          font-weight: 500;
        }
        .dark-theme .tp-theme-btn {
          background: #1e293b;
          border-color: #334155;
          color: #94a3b8;
        }
        .tp-theme-btn:hover {
          border-color: var(--theme-primary);
          color: var(--theme-primary);
        }
        .tp-theme-active {
          border-color: var(--theme-primary) !important;
          background: rgba(30, 136, 229, 0.06) !important;
          color: var(--theme-primary) !important;
        }

        @keyframes tp-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ── Dark Theme Overrides ── */
        .dark-theme {
          --theme-bg: #0f172a;
          --theme-surface: #1e293b;
          --theme-heading: #f1f5f9;
          --theme-muted: #94a3b8;
          --theme-text-muted: #64748b;
          --theme-sidebar-text: #e2e8f0;
          --theme-border: #334155;
          --theme-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
          --theme-shadow-card: 0 1px 4px rgba(0, 0, 0, 0.25);
        }
        .dark-theme img[src*="worknest_logo.png"] {
          filter: brightness(0) invert(1);
        }
        .dark-theme .mp-topbar-logo-area {
          background: #1e293b !important;
          border-right-color: #334155 !important;
          border-bottom-color: #334155 !important;
        }
        .dark-theme .mp-topbar-brand-text {
          color: #f1f5f9 !important;
        }
        .dark-theme .mp-nav-link.active {
          background-color: rgba(116, 96, 238, 0.15) !important;
          color: #b4a2ff !important;
        }
        .dark-theme .mp-nav-link.active .mp-nav-icon {
          color: #b4a2ff !important;
        }
        .dark-theme .mp-sidebar {
          background: #1e293b !important;
        }

        .dark-theme .mp-topbar {
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4) !important;
        }

        .dark-theme .mp-main {
          background: #0f172a !important;
        }

        .dark-theme .card,
        .dark-theme .mp-card,
        .dark-theme .bg-white {
          background: #1e293b !important;
          border-color: #334155 !important;
        }

        .dark-theme .bg-gray-50,
        .dark-theme .bg-gray-100 {
          background: #0f172a !important;
        }

        .dark-theme .border-gray-100,
        .dark-theme .border-gray-200 {
          border-color: #334155 !important;
        }

        .dark-theme .text-gray-800,
        .dark-theme .text-gray-900 {
          color: #f1f5f9 !important;
        }

        .dark-theme .text-gray-700,
        .dark-theme .text-gray-600 {
          color: #cbd5e1 !important;
        }

        .dark-theme .text-gray-500,
        .dark-theme .text-gray-400 {
          color: #64748b !important;
        }

        .dark-theme .mp-table th {
          background: #0f172a !important;
          color: #e2e8f0 !important;
        }

        .dark-theme .mp-table td {
          border-bottom-color: #334155 !important;
        }

        .dark-theme .mp-table tbody tr:hover {
          background: rgba(30, 136, 229, 0.08) !important;
        }

        .dark-theme .mp-form-control,
        .dark-theme .mp-input {
          background-color: #0f172a !important;
          color: #e2e8f0 !important;
          border-color: #334155 !important;
        }

        .dark-theme .mp-form-control:focus,
        .dark-theme .mp-input:focus {
          background: #1e293b !important;
          border-color: var(--theme-primary) !important;
        }

        .dark-theme .shadow-sm {
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25) !important;
        }

        .dark-theme .mp-nav-link {
          color: #cbd5e1 !important;
        }

        .dark-theme .mp-nav-link:hover {
          color: var(--theme-primary) !important;
        }

        .dark-theme .mp-nav-label {
          color: var(--theme-primary) !important;
        }

        @media (max-width: 640px) {
          .tp-panel {
            width: 300px;
            right: -320px;
          }
          .tp-panel.tp-panel-open {
            right: 0;
          }
          .tp-fab {
            bottom: 20px;
            right: 20px;
            width: 46px;
            height: 46px;
          }
        }
      `,
        }}
      />
    </>
  );
}
