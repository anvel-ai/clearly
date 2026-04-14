import { useState, useCallback, useEffect } from "react";
import { readDir, mkdir, writeTextFile, remove, rename, exists } from "@tauri-apps/plugin-fs";

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
}

export function useFileTree() {
  const [workspacePath, setWorkspacePath] = useState<string | null>(
    localStorage.getItem("clearly-workspace"),
  );
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const readDirectory = useCallback(async (dirPath: string): Promise<FileEntry[]> => {
    try {
      const items = await readDir(dirPath);
      const result: FileEntry[] = [];

      for (const item of items) {
        if (item.name?.startsWith(".")) continue;

        const entryPath = `${dirPath}/${item.name}`;
        const entry: FileEntry = {
          name: item.name || "",
          path: entryPath,
          isDirectory: item.isDirectory || false,
        };

        if (entry.isDirectory) {
          result.push(entry);
        } else if (
          entry.name.endsWith(".md") ||
          entry.name.endsWith(".markdown") ||
          entry.name.endsWith(".txt")
        ) {
          result.push(entry);
        }
      }

      result.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      return result;
    } catch {
      return [];
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!workspacePath) return;
    const root = await readDirectory(workspacePath);

    const loadExpanded = async (entries: FileEntry[]): Promise<FileEntry[]> => {
      for (const entry of entries) {
        if (entry.isDirectory && expandedFolders.has(entry.path)) {
          const children = await readDirectory(entry.path);
          entry.children = await loadExpanded(children);
        }
      }
      return entries;
    };

    const loaded = await loadExpanded(root);
    setEntries(loaded);
  }, [workspacePath, expandedFolders, readDirectory]);

  const toggleFolder = useCallback(
    async (path: string) => {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    if (workspacePath) {
      localStorage.setItem("clearly-workspace", workspacePath);
      refresh();
    }
  }, [workspacePath]);

  useEffect(() => {
    if (workspacePath) {
      refresh();
    }
  }, [expandedFolders]);

  const getUniqueName = useCallback(async (dir: string, baseName: string): Promise<string> => {
    const dotIndex = baseName.lastIndexOf(".");
    const name = dotIndex > 0 ? baseName.substring(0, dotIndex) : baseName;
    const ext = dotIndex > 0 ? baseName.substring(dotIndex) : "";

    let candidate = baseName;
    let counter = 0;
    while (await exists(`${dir}/${candidate}`)) {
      counter++;
      candidate = `${name}-${counter}${ext}`;
    }
    return candidate;
  }, []);

  const createFile = useCallback(
    async (dirPath: string, name: string) => {
      const uniqueName = await getUniqueName(dirPath, name);
      const filePath = `${dirPath}/${uniqueName}`;
      await writeTextFile(filePath, "");
      await refresh();
      return filePath;
    },
    [refresh, getUniqueName],
  );

  const createFolder = useCallback(
    async (dirPath: string, name: string) => {
      const folderPath = `${dirPath}/${name}`;
      await mkdir(folderPath);
      await refresh();
    },
    [refresh],
  );

  const deleteEntry = useCallback(
    async (path: string) => {
      await remove(path, { recursive: true });
      await refresh();
    },
    [refresh],
  );

  const renameEntry = useCallback(
    async (oldPath: string, newName: string) => {
      const dir = oldPath.substring(0, oldPath.lastIndexOf("/"));
      const newPath = `${dir}/${newName}`;
      await rename(oldPath, newPath);
      await refresh();
      return newPath;
    },
    [refresh],
  );

  return {
    workspacePath,
    entries,
    expandedFolders,
    setWorkspacePath,
    toggleFolder,
    refresh,
    createFile,
    createFolder,
    deleteEntry,
    renameEntry,
  };
}
