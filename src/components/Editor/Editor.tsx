import { useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import { initMermaid, getMermaidRenderPreview } from "./plugins/mermaidPlugin";
import { useAppStore } from "../../stores/appStore";
import "@milkdown/crepe/theme/frame.css";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/common/block-edit.css";
import "@milkdown/crepe/theme/common/toolbar.css";
import "@milkdown/crepe/theme/common/link-tooltip.css";
import "@milkdown/crepe/theme/common/image-block.css";
import "@milkdown/crepe/theme/common/table.css";
import "@milkdown/crepe/theme/common/latex.css";
import "@milkdown/crepe/theme/common/code-mirror.css";
import "@milkdown/crepe/theme/common/list-item.css";
import "@milkdown/crepe/theme/common/placeholder.css";
import "@milkdown/crepe/theme/common/cursor.css";

interface EditorProps {
  defaultValue?: string;
  onChange?: (markdown: string) => void;
  onReady?: (crepe: Crepe) => void;
}

export default function Editor({ defaultValue = "", onChange, onReady }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    initMermaid(theme);
  }, [theme]);

  useEffect(() => {
    if (!editorRef.current) return;

    initMermaid(theme);

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue,
      features: {
        [Crepe.Feature.Latex]: true,
        [Crepe.Feature.CodeMirror]: true,
        [Crepe.Feature.Table]: true,
        [Crepe.Feature.ImageBlock]: true,
        [Crepe.Feature.BlockEdit]: true,
        [Crepe.Feature.Toolbar]: true,
        [Crepe.Feature.LinkTooltip]: true,
        [Crepe.Feature.ListItem]: true,
        [Crepe.Feature.Cursor]: true,
        [Crepe.Feature.Placeholder]: true,
      },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: "Start writing...",
          mode: "doc",
        },
        [Crepe.Feature.CodeMirror]: {
          renderPreview: getMermaidRenderPreview(),
        },
      },
    });

    crepe.on((api) => {
      api.markdownUpdated((_ctx, markdown) => {
        onChange?.(markdown);
      });
    });

    crepe.create().then(() => {
      crepeRef.current = crepe;
      onReady?.(crepe);
    });

    return () => {
      crepe.destroy();
      crepeRef.current = null;
    };
  }, []);

  return <div ref={editorRef} className="editor-root" />;
}
