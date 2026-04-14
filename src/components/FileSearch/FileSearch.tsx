import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { readDir } from "@tauri-apps/plugin-fs";
import "./FileSearch.css";

interface FileSearchProps {
  visible: boolean;
  onClose: () => void;
  onFileSelect: (path: string) => void;
  workspacePath: string | null;
}

interface FlatFile {
  name: string;
  path: string;
  relativePath: string;
}

export default function FileSearch({
  visible,
  onClose,
  onFileSelect,
  workspacePath,
}: FileSearchProps) {
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<FlatFile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Recursively collect all files
  const collectFiles = useCallback(
    async (dir: string, rootPath: string): Promise<FlatFile[]> => {
      try {
        const items = await readDir(dir);
        const result: FlatFile[] = [];
        for (const item of items) {
          if (item.name?.startsWith(".")) continue;
          const fullPath = `${dir}/${item.name}`;
          if (item.isDirectory) {
            const children = await collectFiles(fullPath, rootPath);
            result.push(...children);
          } else if (
            item.name!.endsWith(".md") ||
            item.name!.endsWith(".markdown") ||
            item.name!.endsWith(".txt")
          ) {
            result.push({
              name: item.name!,
              path: fullPath,
              relativePath: fullPath.slice(rootPath.length + 1),
            });
          }
        }
        return result;
      } catch {
        return [];
      }
    },
    [],
  );

  // Load files when opened
  useEffect(() => {
    if (visible && workspacePath) {
      collectFiles(workspacePath, workspacePath).then(setFiles);
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [visible, workspacePath, collectFiles]);

  // Filter files by query
  const filtered = useMemo(() => {
    if (!query.trim()) return files;
    const lower = query.toLowerCase();
    return files.filter(
      (f) =>
        f.name.toLowerCase().includes(lower) ||
        f.relativePath.toLowerCase().includes(lower),
    );
  }, [files, query]);

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.children[selectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (path: string) => {
      onFileSelect(path);
      onClose();
    },
    [onFileSelect, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filtered[selectedIndex]) {
            handleSelect(filtered[selectedIndex].path);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filtered, selectedIndex, handleSelect, onClose],
  );

  if (!visible) return null;

  return (
    <div className="file-search-overlay" onClick={onClose}>
      <div
        className="file-search-palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <input
          ref={inputRef}
          className="file-search-input"
          type="text"
          placeholder="Search files by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="file-search-list" ref={listRef}>
          {filtered.length === 0 ? (
            <div className="file-search-empty">No files found</div>
          ) : (
            filtered.slice(0, 50).map((file, i) => (
              <div
                key={file.path}
                className={`file-search-item ${i === selectedIndex ? "selected" : ""}`}
                onClick={() => handleSelect(file.path)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span className="file-search-item-icon">
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 1h5.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V14a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" />
                  </svg>
                </span>
                <div className="file-search-item-text">
                  <span className="file-search-item-name">{file.name}</span>
                  <span className="file-search-item-path">{file.relativePath}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
