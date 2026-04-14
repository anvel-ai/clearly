import { useState, useCallback, useEffect, useRef } from "react";
import "./SearchReplace.css";

interface SearchReplaceProps {
  visible: boolean;
  onClose: () => void;
}

export default function SearchReplace({ visible, onClose }: SearchReplaceProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [showReplace, setShowReplace] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const highlightsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    if (visible && searchRef.current) {
      searchRef.current.focus();
      searchRef.current.select();
    }
    if (!visible) {
      clearHighlights();
    }
  }, [visible]);

  const clearHighlights = useCallback(() => {
    highlightsRef.current.forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ""), el);
        parent.normalize();
      }
    });
    highlightsRef.current = [];
    setMatchCount(0);
    setCurrentMatch(0);
  }, []);

  const doSearch = useCallback(() => {
    clearHighlights();
    if (!searchTerm) return;

    const editor = document.querySelector(".milkdown .ProseMirror");
    if (!editor) return;

    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }

    const highlights: HTMLElement[] = [];
    const searchLower = searchTerm.toLowerCase();

    for (const node of textNodes) {
      const text = node.textContent || "";
      const textLower = text.toLowerCase();
      let idx = textLower.indexOf(searchLower);
      if (idx === -1) continue;

      const frag = document.createDocumentFragment();
      let lastIdx = 0;

      while (idx !== -1) {
        if (idx > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, idx)));
        }
        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        mark.textContent = text.slice(idx, idx + searchTerm.length);
        highlights.push(mark);
        frag.appendChild(mark);
        lastIdx = idx + searchTerm.length;
        idx = textLower.indexOf(searchLower, lastIdx);
      }

      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      }

      node.parentNode?.replaceChild(frag, node);
    }

    highlightsRef.current = highlights;
    setMatchCount(highlights.length);
    if (highlights.length > 0) {
      setCurrentMatch(1);
      highlights[0].classList.add("search-highlight-active");
      highlights[0].scrollIntoView({ block: "center" });
    }
  }, [searchTerm, clearHighlights]);

  const navigateMatch = useCallback(
    (direction: "next" | "prev") => {
      if (matchCount === 0) return;
      const highlights = highlightsRef.current;
      highlights[currentMatch - 1]?.classList.remove("search-highlight-active");

      let next = direction === "next" ? currentMatch + 1 : currentMatch - 1;
      if (next > matchCount) next = 1;
      if (next < 1) next = matchCount;

      setCurrentMatch(next);
      highlights[next - 1]?.classList.add("search-highlight-active");
      highlights[next - 1]?.scrollIntoView({ block: "center" });
    },
    [currentMatch, matchCount],
  );

  const handleReplace = useCallback(() => {
    if (matchCount === 0) return;
    const mark = highlightsRef.current[currentMatch - 1];
    if (!mark) return;

    const textNode = document.createTextNode(replaceTerm);
    mark.parentNode?.replaceChild(textNode, mark);
    highlightsRef.current.splice(currentMatch - 1, 1);
    setMatchCount((c) => c - 1);

    if (highlightsRef.current.length > 0) {
      const nextIdx = Math.min(currentMatch, highlightsRef.current.length);
      setCurrentMatch(nextIdx);
      highlightsRef.current[nextIdx - 1]?.classList.add("search-highlight-active");
    } else {
      setCurrentMatch(0);
    }
  }, [currentMatch, matchCount, replaceTerm]);

  const handleReplaceAll = useCallback(() => {
    highlightsRef.current.forEach((mark) => {
      const textNode = document.createTextNode(replaceTerm);
      mark.parentNode?.replaceChild(textNode, mark);
    });
    highlightsRef.current = [];
    setMatchCount(0);
    setCurrentMatch(0);
  }, [replaceTerm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        if (e.shiftKey) {
          navigateMatch("prev");
        } else {
          navigateMatch("next");
        }
      }
    },
    [onClose, navigateMatch],
  );

  if (!visible) return null;

  return (
    <div className="search-replace" onKeyDown={handleKeyDown}>
      <div className="search-row">
        <input
          ref={searchRef}
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyUp={() => doSearch()}
          placeholder="Search..."
        />
        <span className="search-count">
          {matchCount > 0 ? `${currentMatch}/${matchCount}` : "No results"}
        </span>
        <button className="search-btn" onClick={() => navigateMatch("prev")} title="Previous">
          &#8593;
        </button>
        <button className="search-btn" onClick={() => navigateMatch("next")} title="Next">
          &#8595;
        </button>
        <button
          className="search-btn"
          onClick={() => setShowReplace(!showReplace)}
          title="Toggle Replace"
        >
          &#8644;
        </button>
        <button className="search-btn" onClick={onClose} title="Close">
          &#10005;
        </button>
      </div>
      {showReplace && (
        <div className="search-row">
          <input
            className="search-input"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            placeholder="Replace..."
          />
          <button className="search-btn" onClick={handleReplace} title="Replace">
            Replace
          </button>
          <button className="search-btn" onClick={handleReplaceAll} title="Replace All">
            All
          </button>
        </div>
      )}
    </div>
  );
}
