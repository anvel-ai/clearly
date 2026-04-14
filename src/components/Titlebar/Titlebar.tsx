import "./Titlebar.css";

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

  return (
    <div className="titlebar" data-tauri-drag-region>
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
      </div>
    </div>
  );
}
