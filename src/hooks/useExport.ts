import { useCallback } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useAppStore } from "../stores/appStore";

function getEditorHtml(): string {
  const editorEl = document.querySelector(".editor-root .milkdown .ProseMirror");
  if (!editorEl) return "";
  return editorEl.innerHTML;
}

function wrapInHtmlTemplate(bodyHtml: string, title: string, theme: "light" | "dark"): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 40px;
      line-height: 1.8;
      color: ${theme === "dark" ? "#e0e0e0" : "#1a1a1a"};
      background: ${theme === "dark" ? "#1e1e1e" : "#ffffff"};
    }
    h1 { font-size: 2em; margin: 1.2em 0 0.6em; border-bottom: 1px solid ${theme === "dark" ? "#3a3a3a" : "#e8e8e8"}; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; margin: 1em 0 0.5em; }
    h3 { font-size: 1.25em; margin: 0.8em 0 0.4em; }
    p { margin-bottom: 0.8em; }
    code { background: ${theme === "dark" ? "#2d2d30" : "#f4f4f5"}; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: ${theme === "dark" ? "#1e1e1e" : "#282c34"}; color: #abb2bf; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 1em 0; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid ${theme === "dark" ? "#6cb4ee" : "#4a90d9"}; padding-left: 16px; color: ${theme === "dark" ? "#a0a0a0" : "#6b6b6b"}; margin: 0.8em 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid ${theme === "dark" ? "#3a3a3a" : "#e8e8e8"}; padding: 8px 12px; text-align: left; }
    th { background: ${theme === "dark" ? "#2d2d2d" : "#f4f4f5"}; font-weight: 600; }
    img { max-width: 100%; }
    hr { border: none; border-top: 1px solid ${theme === "dark" ? "#3a3a3a" : "#e8e8e8"}; margin: 1.5em 0; }
    a { color: ${theme === "dark" ? "#6cb4ee" : "#4a90d9"}; }
    ul, ol { padding-left: 2em; margin-bottom: 0.8em; }
    @media print { body { color: #000; background: #fff; } }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

export function useExport() {
  const { currentFilePath, theme } = useAppStore();

  const exportHtml = useCallback(async () => {
    const bodyHtml = getEditorHtml();
    if (!bodyHtml) return;

    const title = currentFilePath?.split("/").pop()?.replace(/\.\w+$/, "") || "Untitled";
    const fullHtml = wrapInHtmlTemplate(bodyHtml, title, theme);

    const path = await save({
      filters: [{ name: "HTML", extensions: ["html"] }],
      defaultPath: `${title}.html`,
    });

    if (path) {
      await writeTextFile(path, fullHtml);
    }
  }, [currentFilePath, theme]);

  const exportPdf = useCallback(async () => {
    const bodyHtml = getEditorHtml();
    if (!bodyHtml) return;

    const title = currentFilePath?.split("/").pop()?.replace(/\.\w+$/, "") || "Untitled";
    const fullHtml = wrapInHtmlTemplate(bodyHtml, title, theme);

    // Open a new window with the HTML content and trigger print (Save as PDF)
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }, [currentFilePath, theme]);

  return { exportHtml, exportPdf };
}
