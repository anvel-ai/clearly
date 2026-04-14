import { useMemo } from "react";
import { useAppStore } from "../../stores/appStore";
import "./StatusBar.css";

export default function StatusBar() {
  const { crepe, isDirty, currentFilePath } = useAppStore();

  const stats = useMemo(() => {
    if (!crepe) return { words: 0, chars: 0, lines: 0 };
    try {
      const md = crepe.getMarkdown();
      const text = md.trim();
      const words = text ? text.split(/\s+/).length : 0;
      const chars = text.length;
      const lines = md.split("\n").length;
      return { words, chars, lines };
    } catch {
      return { words: 0, chars: 0, lines: 0 };
    }
  }, [crepe, isDirty]);

  const saveStatus = isDirty ? "Unsaved" : "Saved";

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-item">
          {stats.words} words
        </span>
        <span className="status-item">
          {stats.chars} chars
        </span>
        <span className="status-item">
          {stats.lines} lines
        </span>
      </div>
      <div className="status-bar-right">
        <span className={`status-item ${isDirty ? "status-unsaved" : ""}`}>
          {saveStatus}
        </span>
        {currentFilePath && (
          <span className="status-item status-filepath" title={currentFilePath}>
            {currentFilePath.split("/").slice(-2).join("/")}
          </span>
        )}
      </div>
    </div>
  );
}
