import mermaid from "mermaid";

let idCounter = 0;
let currentTheme: "light" | "dark" = "light";

export function initMermaid(theme: "light" | "dark") {
  currentTheme = theme;
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === "dark" ? "dark" : "default",
    securityLevel: "loose",
    flowchart: { htmlLabels: false, useMaxWidth: true },
  });
}

// Replace <foreignObject> blocks with native SVG <text> elements so the
// output survives DOMPurify sanitization (which strips <foreignObject>).
function convertForeignObjectsToText(svgRoot: SVGSVGElement, textColor: string) {
  const fos = Array.from(svgRoot.querySelectorAll("foreignObject"));
  for (const fo of fos) {
    const x = parseFloat(fo.getAttribute("x") || "0");
    const y = parseFloat(fo.getAttribute("y") || "0");
    const w = parseFloat(fo.getAttribute("width") || "0");
    const h = parseFloat(fo.getAttribute("height") || "0");
    const labelText = (fo.textContent || "").trim();

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(x + w / 2));
    text.setAttribute("y", String(y + h / 2 + 3));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.setAttribute("fill", textColor);
    text.setAttribute(
      "style",
      `font-family: "trebuchet ms", verdana, arial, sans-serif; font-size: 14px;`,
    );
    text.textContent = labelText;

    fo.parentNode?.replaceChild(text, fo);
  }
}

function postProcessSvg(svgStr: string, theme: "light" | "dark"): string {
  const isDark = theme === "dark";
  const bg = isDark ? "#1e1e1e" : "#ffffff";
  const textColor = isDark ? "#e5e5e5" : "#1a1a1a";

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgStr, "image/svg+xml");
  const svgRoot = doc.documentElement as unknown as SVGSVGElement;

  convertForeignObjectsToText(svgRoot, textColor);

  svgRoot.querySelectorAll<SVGTextElement>("text, tspan").forEach((t) => {
    t.setAttribute("fill", textColor);
  });

  const serialized = new XMLSerializer().serializeToString(svgRoot);
  return `<div class="clearly-mermaid" style="background:${bg};padding:16px;border-radius:8px;display:flex;justify-content:center;">${serialized}</div>`;
}

type ApplyPreview = (value: null | string | HTMLElement) => void;

export function getMermaidRenderPreview() {
  return (language: string, content: string, applyPreview: ApplyPreview) => {
    if (language !== "mermaid" || !content.trim()) return null;

    const loading = document.createElement("div");
    loading.textContent = "Rendering diagram...";
    loading.style.padding = "16px";
    loading.style.textAlign = "center";
    loading.style.color = "var(--text-muted, #888)";
    loading.style.fontSize = "13px";

    const id = `mermaid-${Date.now()}-${idCounter++}`;

    mermaid
      .render(id, content.trim())
      .then(({ svg }) => {
        const processed = postProcessSvg(svg, currentTheme);
        applyPreview(processed);
      })
      .catch((err) => {
        console.error("Mermaid render error:", err);
        applyPreview(
          `<div style="color:var(--text-muted);padding:8px;font-size:13px">Invalid mermaid syntax</div>`,
        );
      });

    return loading;
  };
}
