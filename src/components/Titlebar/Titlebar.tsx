import { getCurrentWindow } from "@tauri-apps/api/window";
import "./Titlebar.css";

// Windows / Linux don't have native traffic lights and we disable their
// decorations at startup — so the custom titlebar needs to draw its own
// minimize / maximize / close affordances. macOS keeps the system controls.
const needsWindowControls =
  typeof navigator !== "undefined" &&
  /Windows|Linux/i.test(navigator.userAgent) &&
  !/Android/i.test(navigator.userAgent);

interface TitlebarProps {
  filename?: string;
  isDirty?: boolean;
  onToggleTheme?: () => void;
  onToggleSidebar?: () => void;
}

export default function Titlebar({
  filename,
  isDirty = false,
  onToggleTheme,
  onToggleSidebar,
}: TitlebarProps) {
  const displayName = filename || "Untitled";

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on left mouse button and not on buttons
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    getCurrentWindow().startDragging();
  };

  return (
    <div
      className={`titlebar${needsWindowControls ? " titlebar--custom-controls" : ""}`}
      onMouseDown={handleMouseDown}
    >
      <div className="titlebar-left">
        <button className="titlebar-btn" onClick={onToggleSidebar} title="Toggle Sidebar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="3" width="14" height="1.5" rx="0.75" />
            <rect x="1" y="7.25" width="14" height="1.5" rx="0.75" />
            <rect x="1" y="11.5" width="14" height="1.5" rx="0.75" />
          </svg>
        </button>
      </div>
      <div className="titlebar-center" data-tauri-drag-region>
        <span className="titlebar-filename">
          {isDirty && <span className="titlebar-dirty" />}
          {displayName}
        </span>
      </div>
      <div className="titlebar-right">
        <button className="titlebar-btn" onClick={onToggleTheme} title="Toggle Theme">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM8 13V3a5 5 0 010 10z" />
          </svg>
        </button>
        {needsWindowControls && (
          <div className="titlebar-window-controls">
            <button
              className="titlebar-ctrl"
              onClick={() => getCurrentWindow().minimize()}
              title="Minimize"
              aria-label="Minimize"
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect x="1" y="4.5" width="8" height="1" fill="currentColor" />
              </svg>
            </button>
            <button
              className="titlebar-ctrl"
              onClick={() => getCurrentWindow().toggleMaximize()}
              title="Maximize"
              aria-label="Maximize"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
                <rect x="1.5" y="1.5" width="7" height="7" strokeWidth="1" />
              </svg>
            </button>
            <button
              className="titlebar-ctrl titlebar-ctrl--close"
              onClick={() => getCurrentWindow().close()}
              title="Close"
              aria-label="Close"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1">
                <line x1="1.5" y1="1.5" x2="8.5" y2="8.5" />
                <line x1="8.5" y1="1.5" x2="1.5" y2="8.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
