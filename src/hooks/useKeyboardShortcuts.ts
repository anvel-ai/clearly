import { useEffect } from "react";

interface ShortcutHandlers {
  onSave?: () => void;
  onSaveAs?: () => void;
  onOpen?: () => void;
  onNew?: () => void;
  onToggleSidebar?: () => void;
  onFind?: () => void;
  onFileSearch?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault();
          if (e.shiftKey) {
            handlers.onSaveAs?.();
          } else {
            handlers.onSave?.();
          }
          break;
        case "o":
          e.preventDefault();
          handlers.onOpen?.();
          break;
        case "n":
          e.preventDefault();
          handlers.onNew?.();
          break;
        case "b":
          e.preventDefault();
          handlers.onToggleSidebar?.();
          break;
        case "f":
          if (!e.shiftKey) {
            e.preventDefault();
            handlers.onFind?.();
          }
          break;
        case "p":
          e.preventDefault();
          handlers.onFileSearch?.();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
