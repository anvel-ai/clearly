import { useState, useCallback, useEffect, useRef } from "react";
import type { FileEntry } from "./useFileTree";
import { useAppStore } from "../../stores/appStore";

interface FileTreeProps {
  entries: FileEntry[];
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onFileSelect: (path: string) => void;
  onRefresh: () => void;
  workspacePath: string;
  depth?: number;
  creatingInDir?: string | null;
  onCreateDone?: () => void;
}

interface ContextMenu {
  x: number;
  y: number;
  entry: FileEntry | null;
  parentDir: string;
}

export default function FileTree({
  entries,
  expandedFolders,
  onToggleFolder,
  onFileSelect,
  onRefresh,
  workspacePath,
  depth = 0,
  creatingInDir,
  onCreateDone,
}: FileTreeProps) {
  const currentFilePath = useAppStore((s) => s.currentFilePath);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);
  const [creatingIn, setCreatingIn] = useState<string | null>(null);
  const [createValue, setCreateValue] = useState("untitled.md");
  const createRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingPath && renameRef.current) {
      renameRef.current.focus();
      const dotIndex = renameValue.lastIndexOf(".");
      renameRef.current.setSelectionRange(0, dotIndex > 0 ? dotIndex : renameValue.length);
    }
  }, [renamingPath]);

  useEffect(() => {
    if (creatingInDir && depth === 0) {
      setCreatingIn(creatingInDir);
      setCreateValue("untitled.md");
    }
  }, [creatingInDir, depth]);

  useEffect(() => {
    if (creatingIn && createRef.current) {
      createRef.current.focus();
      const dotIndex = createValue.lastIndexOf(".");
      createRef.current.setSelectionRange(0, dotIndex > 0 ? dotIndex : createValue.length);
    }
  }, [creatingIn]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [contextMenu]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, entry: FileEntry | null, parentDir: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, entry, parentDir });
    },
    [],
  );

  const handleRenameSubmit = useCallback(
    async (oldPath: string) => {
      if (!renameValue.trim()) {
        setRenamingPath(null);
        return;
      }
      try {
        const { rename } = await import("@tauri-apps/plugin-fs");
        const dir = oldPath.substring(0, oldPath.lastIndexOf("/"));
        await rename(oldPath, `${dir}/${renameValue}`);
        onRefresh();
      } catch (err) {
        console.error("Rename failed:", err);
      }
      setRenamingPath(null);
    },
    [renameValue, onRefresh],
  );

  const handleStartCreate = useCallback(
    (dir: string, isFolder: boolean) => {
      if (isFolder) {
        // Folder creation stays simple
        (async () => {
          try {
            const { mkdir } = await import("@tauri-apps/plugin-fs");
            await mkdir(`${dir}/New Folder`);
            onRefresh();
          } catch (err) {
            console.error("Create folder failed:", err);
          }
        })();
      } else {
        setCreatingIn(dir);
        setCreateValue("untitled.md");
      }
      setContextMenu(null);
    },
    [onRefresh],
  );

  const handleCreateSubmit = useCallback(
    async () => {
      if (!creatingIn) return;
      let name = createValue.trim();
      if (!name) {
        setCreatingIn(null);
        onCreateDone?.();
        return;
      }
      // Auto-add .md extension if no extension provided
      if (!name.includes(".")) {
        name = `${name}.md`;
      }
      try {
        const { exists, writeTextFile } = await import("@tauri-apps/plugin-fs");
        // Find unique name if duplicate exists
        const dotIndex = name.lastIndexOf(".");
        const baseName = dotIndex > 0 ? name.substring(0, dotIndex) : name;
        const ext = dotIndex > 0 ? name.substring(dotIndex) : "";
        let candidate = name;
        let counter = 0;
        while (await exists(`${creatingIn}/${candidate}`)) {
          counter++;
          candidate = `${baseName}-${counter}${ext}`;
        }
        await writeTextFile(`${creatingIn}/${candidate}`, "");
        onRefresh();
      } catch (err) {
        console.error("Create file failed:", err);
      }
      setCreatingIn(null);
      onCreateDone?.();
    },
    [creatingIn, createValue, onRefresh, onCreateDone],
  );

  const handleCreateCancel = useCallback(() => {
    setCreatingIn(null);
    onCreateDone?.();
  }, [onCreateDone]);

  const handleDelete = useCallback(
    async (path: string) => {
      try {
        const { remove } = await import("@tauri-apps/plugin-fs");
        await remove(path, { recursive: true });
        onRefresh();
      } catch (err) {
        console.error("Delete failed:", err);
      }
      setContextMenu(null);
    },
    [onRefresh],
  );

  return (
    <>
      <div
        onContextMenu={(e) => handleContextMenu(e, null, workspacePath)}
        style={{ minHeight: depth === 0 ? "100%" : undefined }}
      >
        {creatingIn === workspacePath && (
          <div
            className="file-tree-item"
            style={{ "--depth": depth } as React.CSSProperties}
          >
            <span className="file-tree-icon">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 1h5.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V14a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" />
              </svg>
            </span>
            <input
              ref={createRef}
              className="file-tree-rename-input"
              value={createValue}
              onChange={(e) => setCreateValue(e.target.value)}
              onBlur={handleCreateSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSubmit();
                if (e.key === "Escape") handleCreateCancel();
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        {entries.map((entry) => {
          const isExpanded = expandedFolders.has(entry.path);
          const isActive = entry.path === currentFilePath;
          const isRenaming = entry.path === renamingPath;

          return (
            <div key={entry.path}>
              <div
                className={`file-tree-item ${isActive ? "active" : ""}`}
                style={{ "--depth": depth } as React.CSSProperties}
                onClick={() => {
                  if (entry.isDirectory) {
                    onToggleFolder(entry.path);
                  } else {
                    onFileSelect(entry.path);
                  }
                }}
                onContextMenu={(e) => {
                  handleContextMenu(
                    e,
                    entry,
                    entry.isDirectory
                      ? entry.path
                      : entry.path.substring(0, entry.path.lastIndexOf("/")),
                  );
                }}
              >
                {entry.isDirectory && (
                  <span className={`file-tree-chevron ${isExpanded ? "expanded" : ""}`}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M3 1l5 4-5 4V1z" />
                    </svg>
                  </span>
                )}
                <span className="file-tree-icon">
                  {entry.isDirectory ? (
                    <svg viewBox="0 0 16 16" fill="currentColor">
                      <path d="M1 3.5A1.5 1.5 0 012.5 2h3.879a1.5 1.5 0 011.06.44l1.122 1.12A1.5 1.5 0 009.62 4H13.5A1.5 1.5 0 0115 5.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5v-9z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4 1h5.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V14a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" />
                    </svg>
                  )}
                </span>
                {isRenaming ? (
                  <input
                    ref={renameRef}
                    className="file-tree-rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameSubmit(entry.path)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit(entry.path);
                      if (e.key === "Escape") setRenamingPath(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="file-tree-name">{entry.name}</span>
                )}
              </div>
              {entry.isDirectory && isExpanded && entry.children && (
                <FileTree
                  entries={entry.children}
                  expandedFolders={expandedFolders}
                  onToggleFolder={onToggleFolder}
                  onFileSelect={onFileSelect}
                  onRefresh={onRefresh}
                  workspacePath={entry.path}
                  depth={depth + 1}
                  creatingInDir={creatingIn}
                  onCreateDone={handleCreateCancel}
                />
              )}
            </div>
          );
        })}
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="context-menu-item"
            onClick={() => handleStartCreate(contextMenu.parentDir, false)}
          >
            New File
          </button>
          <button
            className="context-menu-item"
            onClick={() => handleStartCreate(contextMenu.parentDir, true)}
          >
            New Folder
          </button>
          {contextMenu.entry && (
            <>
              <div className="context-menu-separator" />
              <button
                className="context-menu-item"
                onClick={() => {
                  if (contextMenu.entry) {
                    setRenamingPath(contextMenu.entry.path);
                    setRenameValue(contextMenu.entry.name);
                  }
                  setContextMenu(null);
                }}
              >
                Rename
              </button>
              <button
                className="context-menu-item"
                onClick={() => contextMenu.entry && handleDelete(contextMenu.entry.path)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
