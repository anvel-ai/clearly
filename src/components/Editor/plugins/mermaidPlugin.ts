import mermaid from "mermaid";

let idCounter = 0;

export function initMermaid(theme: "light" | "dark") {
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === "dark" ? "dark" : "default",
    securityLevel: "loose",
  });
}

export function getMermaidRenderPreview() {
  return (language: string, content: string, applyPreview: (html: string) => void) => {
    if (language !== "mermaid" || !content.trim()) return null;

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.padding = "16px 0";

    const id = `mermaid-${Date.now()}-${idCounter++}`;

    mermaid
      .render(id, content.trim())
      .then(({ svg }) => {
        applyPreview(
          `<div style="display:flex;justify-content:center;padding:16px 0">${svg}</div>`,
        );
      })
      .catch(() => {
        applyPreview(
          `<div style="color:var(--text-muted);padding:8px;font-size:13px">Invalid mermaid syntax</div>`,
        );
      });

    container.textContent = "Rendering diagram...";
    return container;
  };
}
