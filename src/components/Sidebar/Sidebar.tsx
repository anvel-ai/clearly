import { useCallback, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import FileTree from "./FileTree";
import { useFileTree } from "./useFileTree";
import "./Sidebar.css";

interface SidebarProps {
  onFileSelect: (path: string) => void;
}

export default function Sidebar({ onFileSelect }: SidebarProps) {
  const { workspacePath, entries, expandedFolders, setWorkspacePath, toggleFolder, refresh } =
    useFileTree();
  const [creatingInDir, setCreatingInDir] = useState<string | null>(null);

  const handleOpenFolder = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false });
    if (selected) {
      setWorkspacePath(selected as string);
    }
  }, [setWorkspacePath]);

  const handleNewFile = useCallback(() => {
    if (workspacePath) {
      setCreatingInDir(workspacePath);
    }
  }, [workspacePath]);

  const handleCreateDone = useCallback(() => {
    setCreatingInDir(null);
  }, []);

  const workspaceName = workspacePath?.split("/").pop() || "";

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        {workspacePath ? (
          <span className="sidebar-workspace-name" title={workspacePath}>
            {workspaceName}
          </span>
        ) : (
          <span className="sidebar-workspace-name">EXPLORER</span>
        )}
        <div className="sidebar-header-actions">
          {workspacePath && (
            <button className="sidebar-btn" onClick={handleNewFile} title="New File">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <button className="sidebar-btn" onClick={handleOpenFolder} title="Open Folder">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 3.5A1.5 1.5 0 012.5 2h3.879a1.5 1.5 0 011.06.44l1.122 1.12A1.5 1.5 0 009.62 4H13.5A1.5 1.5 0 0115 5.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5v-9z" />
            </svg>
          </button>
        </div>
      </div>
      {workspacePath ? (
        <div className="sidebar-tree">
          <FileTree
            entries={entries}
            expandedFolders={expandedFolders}
            onToggleFolder={toggleFolder}
            onFileSelect={onFileSelect}
            onRefresh={refresh}
            workspacePath={workspacePath}
            creatingInDir={creatingInDir}
            onCreateDone={handleCreateDone}
          />
        </div>
      ) : (
        <div className="sidebar-empty">
          <button className="sidebar-open-btn" onClick={handleOpenFolder}>
            Open Folder
          </button>
        </div>
      )}
    </div>
  );
}
