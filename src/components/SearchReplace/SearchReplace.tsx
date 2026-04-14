import { useState, useCallback, useEffect, useRef } from "react";
import "./SearchReplace.css";

interface SearchReplaceProps {
  visible: boolean;
  onClose: () => void;
}

interface MatchRange {
  node: Text;
  start: number;
  end: number;
}

function findAllMatches(root: Element, term: string): MatchRange[] {
  if (!term) return [];
  const matches: MatchRange[] = [];
  const lower = term.toLowerCase();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = node.textContent || "";
    const textLower = text.toLowerCase();
    let idx = textLower.indexOf(lower);
    while (idx !== -1) {
      matches.push({ node, start: idx, end: idx + term.length });
      idx = textLower.indexOf(lower, idx + term.length);
    }
  }
  return matches;
}

function highlightMatch(match: MatchRange) {
  const range = document.createRange();
  range.setStart(match.node, match.start);
  range.setEnd(match.node, match.end);

  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);

  const el = match.node.parentElement;
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
}

export default function SearchReplace({ visible, onClose }: SearchReplaceProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [matches, setMatches] = useState<MatchRange[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showReplace, setShowReplace] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible && searchRef.current) {
      searchRef.current.focus();
      searchRef.current.select();
    }
    if (!visible) {
      setSearchTerm("");
      setMatches([]);
      setCurrentIndex(-1);
      window.getSelection()?.removeAllRanges();
    }
  }, [visible]);

  const doSearch = useCallback(() => {
    const editor = document.querySelector(".milkdown .ProseMirror");
    if (!editor || !searchTerm.trim()) {
      setMatches([]);
      setCurrentIndex(-1);
      return;
    }
    const found = findAllMatches(editor, searchTerm.trim());
    setMatches(found);
    if (found.length > 0) {
      setCurrentIndex(0);
      highlightMatch(found[0]);
    } else {
      setCurrentIndex(-1);
    }
  }, [searchTerm]);

  const navigateMatch = useCallback(
    (direction: "next" | "prev") => {
      // If no search done yet, do search first
      if (matches.length === 0 && searchTerm.trim()) {
        doSearch();
        return;
      }
      if (matches.length === 0) return;
      let next =
        direction === "next"
          ? (currentIndex + 1) % matches.length
          : (currentIndex - 1 + matches.length) % matches.length;
      setCurrentIndex(next);
      highlightMatch(matches[next]);
    },
    [currentIndex, matches, searchTerm, doSearch],
  );

  const handleReplace = useCallback(() => {
    if (matches.length === 0 || currentIndex < 0) return;
    const match = matches[currentIndex];
    try {
      const range = document.createRange();
      range.setStart(match.node, match.start);
      range.setEnd(match.node, match.end);
      range.deleteContents();
      range.insertNode(document.createTextNode(replaceTerm));
      match.node.parentNode?.normalize();
    } catch {
      // Node may have changed
    }
    doSearch();
  }, [matches, currentIndex, replaceTerm, doSearch]);

  const handleReplaceAll = useCallback(() => {
    if (matches.length === 0) return;
    for (let i = matches.length - 1; i >= 0; i--) {
      try {
        const m = matches[i];
        const range = document.createRange();
        range.setStart(m.node, m.start);
        range.setEnd(m.node, m.end);
        range.deleteContents();
        range.insertNode(document.createTextNode(replaceTerm));
        m.node.parentNode?.normalize();
      } catch {
        // Node may have been modified
      }
    }
    setMatches([]);
    setCurrentIndex(-1);
  }, [matches, replaceTerm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (matches.length === 0) {
          doSearch();
        } else if (e.shiftKey) {
          navigateMatch("prev");
        } else {
          navigateMatch("next");
        }
      }
    },
    [onClose, navigateMatch, doSearch, matches],
  );

  if (!visible) return null;

  const matchDisplay =
    matches.length > 0
      ? `${currentIndex + 1}/${matches.length}`
      : searchTerm.trim()
        ? "No results"
        : "";

  return (
    <div className="search-replace" onKeyDown={handleKeyDown}>
      <div className="search-row">
        <input
          ref={searchRef}
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
        />
        {matchDisplay && <span className="search-count">{matchDisplay}</span>}
        <button className="search-btn" onClick={doSearch} title="Search">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="5" />
            <line x1="10" y1="10" x2="15" y2="15" />
          </svg>
        </button>
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
