import { useCallback, useEffect, useMemo, useState } from "react";
import Editor from "./components/Editor/Editor";
import Titlebar from "./components/Titlebar/Titlebar";
import Sidebar from "./components/Sidebar/Sidebar";
import StatusBar from "./components/StatusBar/StatusBar";
import SearchReplace from "./components/SearchReplace/SearchReplace";
import FileSearch from "./components/FileSearch/FileSearch";
import UpdateBanner from "./components/UpdateBanner/UpdateBanner";
import { useAppStore } from "./stores/appStore";
import { useFileOperations } from "./hooks/useFileOperations";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./styles/variables.css";
import "./styles/global.css";
import "./App.css";
import "./components/Editor/editorTheme.css";

const DEFAULT_CONTENT = `# Welcome to Clearly

A clean, minimal markdown editor.

## Features

- **WYSIWYG editing** -- type markdown and see it rendered instantly
- Tables, code blocks, math equations, and more
- Dark and light themes

## Try it out

Start typing below, or use the **slash command** by typing \`/\` at the beginning of a new line.

> "The best writing tool is the one that gets out of your way."

---

### Code Example

\`\`\`javascript
function hello() {
  console.log("Hello from Clearly!");
}
\`\`\`

### Math

Inline math: $E = mc^2$

### Table

| Feature | Status |
|---------|--------|
| WYSIWYG | Done |
| Themes  | Done |
| Export  | Coming |

### Mermaid Diagram

\`\`\`mermaid
flowchart LR
    A[Write] --> B[Preview]
    B --> C{Happy?}
    C -->|Yes| D[Save]
    C -->|No| A
\`\`\`
`;

function App() {
  const {
    currentFilePath,
    isDirty,
    sidebarOpen,
    theme,
    toggleTheme,
    toggleSidebar,
    setDirty,
    setCrepe,
  } = useAppStore();

  const [editorContent, setEditorContent] = useState(DEFAULT_CONTENT);
  const [editorKey, setEditorKey] = useState(0);
  const [searchVisible, setSearchVisible] = useState(false);
  const [fileSearchVisible, setFileSearchVisible] = useState(false);
  const { openFile, saveFile, saveAs, newFile, scheduleAutoSave } =
    useFileOperations();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleOpen = useCallback(async () => {
    const content = await openFile();
    if (content !== null) {
      setEditorContent(content);
      setEditorKey((k) => k + 1);
    }
  }, [openFile]);

  const handleNew = useCallback(() => {
    const content = newFile();
    setEditorContent(content);
    setEditorKey((k) => k + 1);
  }, [newFile]);

  const handleFileSelect = useCallback(
    async (path: string) => {
      try {
        const content = await readTextFile(path);
        useAppStore.getState().setCurrentFile(path);
        setEditorContent(content);
        setEditorKey((k) => k + 1);
      } catch (err) {
        console.error("Failed to open file:", err);
      }
    },
    [],
  );

  // Drag & drop file open
  useEffect(() => {
    const unlisten = getCurrentWindow().onDragDropEvent((event) => {
      if (event.payload.type === "drop") {
        const paths = event.payload.paths;
        const file = paths.find(
          (p) => p.endsWith(".md") || p.endsWith(".markdown") || p.endsWith(".txt"),
        );
        if (file) {
          handleFileSelect(file);
        }
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [handleFileSelect]);

  const handleChange = useCallback(
    (_markdown: string) => {
      setDirty(true);
      if (currentFilePath) {
        scheduleAutoSave();
      }
    },
    [setDirty, currentFilePath, scheduleAutoSave],
  );

  const shortcuts = useMemo(
    () => ({
      onSave: saveFile,
      onSaveAs: saveAs,
      onOpen: handleOpen,
      onNew: handleNew,
      onToggleSidebar: toggleSidebar,
      onFind: () => setSearchVisible(true),
      onFileSearch: () => setFileSearchVisible(true),
    }),
    [saveFile, saveAs, handleOpen, handleNew, toggleSidebar],
  );

  useKeyboardShortcuts(shortcuts);

  const filename = currentFilePath
    ? currentFilePath.split("/").pop() || "Untitled"
    : undefined;

  return (
    <div className="app">
      <Titlebar
        filename={filename}
        isDirty={isDirty}
        onToggleTheme={toggleTheme}
        onToggleSidebar={toggleSidebar}
      />
      <UpdateBanner />
      <div className="app-body">
        {sidebarOpen && <Sidebar onFileSelect={handleFileSelect} />}
        <Editor
          key={editorKey}
          defaultValue={editorContent}
          onChange={handleChange}
          onReady={(crepe) => setCrepe(crepe)}
        />
      </div>
      <StatusBar />
      <SearchReplace visible={searchVisible} onClose={() => setSearchVisible(false)} />
      <FileSearch
        visible={fileSearchVisible}
        onClose={() => setFileSearchVisible(false)}
        onFileSelect={handleFileSelect}
        workspacePath={localStorage.getItem("clearly-workspace")}
      />
    </div>
  );
}

export default App;
