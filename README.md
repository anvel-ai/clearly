# Clearly

A clean, minimal markdown editor built with Tauri + React.

## Features

- **WYSIWYG Editing** - Type markdown and see it rendered instantly
- **Rich Content** - Tables, code blocks with syntax highlighting, math equations (KaTeX), Mermaid diagrams
- **Dark / Light Themes** - Toggle between themes
- **File Management** - Open, create, save, rename, delete files with auto-save
- **File Search** - Quick open files with Cmd+P
- **In-Editor Search & Replace** - Find and replace text with Cmd+F
- **Sidebar File Tree** - Browse workspace files with context menu actions
- **Keyboard Shortcuts** - Cmd+S, Cmd+N, Cmd+O, Cmd+P, Cmd+F, Cmd+B and more

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Tauri 2](https://tauri.app/) |
| Frontend | React 19, TypeScript 5.8, Vite 7 |
| Editor | [Milkdown](https://milkdown.dev/) (Crepe) |
| State | Zustand |
| Math | KaTeX |
| Diagrams | Mermaid |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- Tauri CLI (`npm install -g @tauri-apps/cli`)

### Install & Run

```bash
# Install dependencies
npm install

# Run in development
npm run tauri dev

# Build for production
npm run tauri build
```

## Project Structure

```
src/
  components/
    Editor/          # Milkdown WYSIWYG editor
    Sidebar/         # File tree, workspace management
    Titlebar/        # Custom titlebar with drag support
    StatusBar/       # Word count, file info
    SearchReplace/   # In-editor search & replace
    FileSearch/      # Quick open file palette (Cmd+P)
  hooks/             # useFileOperations, useKeyboardShortcuts
  stores/            # Zustand app state
  styles/            # CSS variables, global styles
src-tauri/
  src/               # Rust backend
  capabilities/      # Tauri permissions
  tauri.conf.json    # Tauri configuration
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+S | Save |
| Cmd+Shift+S | Save As |
| Cmd+N | New File |
| Cmd+O | Open File |
| Cmd+P | File Search |
| Cmd+F | Find in Editor |
| Cmd+B | Toggle Sidebar |

## License

MIT
