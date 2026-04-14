import { useCallback, useRef } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "../stores/appStore";

const MD_FILTERS = [
  { name: "Markdown", extensions: ["md", "markdown", "txt"] },
];

export function useFileOperations() {
  const { currentFilePath, crepe, setCurrentFile, setDirty } = useAppStore();
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadContent = useCallback(
    async (path: string) => {
      const content = await readTextFile(path);
      if (crepe) {
        crepe.setReadonly(false);
        crepe.destroy().then(() => {
          // Re-create the editor with new content handled at App level
        });
      }
      setCurrentFile(path);
      return content;
    },
    [crepe, setCurrentFile],
  );

  const openFile = useCallback(async () => {
    const selected = await open({
      multiple: false,
      filters: MD_FILTERS,
    });
    if (!selected) return null;

    const path = typeof selected === "string" ? selected : selected;
    const content = await readTextFile(path);
    setCurrentFile(path);
    return content;
  }, [setCurrentFile]);

  const saveFile = useCallback(async () => {
    if (!crepe) return;
    const markdown = crepe.getMarkdown();

    if (currentFilePath) {
      await writeTextFile(currentFilePath, markdown);
      setDirty(false);
    } else {
      const path = await save({
        filters: MD_FILTERS,
        defaultPath: "untitled.md",
      });
      if (path) {
        await writeTextFile(path, markdown);
        setCurrentFile(path);
      }
    }
  }, [crepe, currentFilePath, setCurrentFile, setDirty]);

  const saveAs = useCallback(async () => {
    if (!crepe) return;
    const markdown = crepe.getMarkdown();

    const path = await save({
      filters: MD_FILTERS,
      defaultPath: currentFilePath?.split("/").pop() || "untitled.md",
    });
    if (path) {
      await writeTextFile(path, markdown);
      setCurrentFile(path);
    }
  }, [crepe, currentFilePath, setCurrentFile]);

  const newFile = useCallback(() => {
    setCurrentFile(null);
    setDirty(false);
    return "";
  }, [setCurrentFile, setDirty]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      if (currentFilePath && crepe) {
        const markdown = crepe.getMarkdown();
        writeTextFile(currentFilePath, markdown).then(() => {
          setDirty(false);
        });
      }
    }, 2000);
  }, [currentFilePath, crepe, setDirty]);

  return { openFile, saveFile, saveAs, newFile, loadContent, scheduleAutoSave };
}
