# 🗺️ EA Roadmap

A lightweight, browser-based **Enterprise Architecture Roadmap** tool that lets you visually plan and track architecture activities across a full year — no server, no login, no installation required.

---

## ✨ Features

- **Interactive Timeline** — Drag, drop, and resize milestones on a 52-week Gantt-style grid (weeks labelled **CW1–CW52**)
- **Multi-Client Support** — Manage separate roadmaps for multiple clients in a single session
- **Activity Categories** — Fully customizable categories with color coding (Discovery, Design, Implementation, etc.)
- **Milestone Memos** — Click any milestone to pin its tooltip and add timestamped comments
- **SAP Activate Phases Overlay** — Toggle a resizable, color-coded overlay showing SAP Activate phases (Discover, Prepare, Explore, Realize, Deploy, Run) across the timeline; drag phase borders to resize, double-click labels to rename
- **Export Options** — Download your data as **CSV** (for Excel/Sheets) or **JSON** (for backup/import)
- **Import** — Restore a previously exported JSON backup
- **Dark Mode** — One-click toggle between light and dark themes
- **Responsive Toolbar** — At narrow window widths, buttons automatically collapse to icon-only with hover tooltips so the toolbar never wraps
- **Zero Dependencies** — Pure HTML, CSS, and vanilla JavaScript — works offline right out of the box

---

## 🚀 Getting Started

1. **Download or clone** this repository
2. Open `index.html` in any modern web browser
3. Start planning!

> No build step, no npm install, no server needed.

---

## 💾 Data Storage

All data is saved automatically to your **browser's localStorage**. This means:

- ✅ Your data persists across page refreshes
- ✅ App updates (new versions) will **never overwrite your data**
- ⚠️ Data is **browser-specific** — use **Export JSON** to back up or transfer data between browsers/devices

---

## 📤 Exporting Data

Click the **Export ▼** button in the toolbar to choose:

| Format | Use Case |
|--------|----------|
| **Export as CSV** | Open in Excel, Google Sheets, or any spreadsheet app |
| **Export as JSON** | Full backup — can be re-imported back into the app |

---

## 🗂️ SAP Activate Phases Overlay

Click the **Phases** button in the toolbar to show or hide the overlay. When visible:

| Action | How |
|--------|-----|
| **Resize a phase** | Drag the right border of any phase block left or right |
| **Rename a phase** | Double-click the phase label and type a new name |
| **Hide overlay** | Click the **Phases** button again |

Phase boundaries also show as dashed vertical lines extending down through the entire swimlane canvas.
All customizations (sizes and names) persist in localStorage.

---

## 🎨 Customizing Categories

Click the **pencil (✏️) icon** next to the Legend button to open the category editor. You can:
- Add or remove activity types
- Rename existing categories
- Change their colors

---

## 🗂️ Project Structure

```
roadmap-app/
├── index.html          # Main application shell
├── favicon.svg         # App icon
├── css/
│   └── styles.css      # All styling (responsive, dark mode, phases)
└── js/
    ├── app.js          # Application initializer
    ├── state.js        # State management & localStorage persistence
    ├── ui.js           # UI interactions (modals, tooltips, toolbar)
    ├── timeline.js     # Timeline rendering, milestone layout & phases overlay
    ├── drag.js         # Drag, drop & resize logic
    └── utils.js        # Shared utility functions
```

---

## 🖥️ Browser Compatibility

Works in all modern browsers: Chrome, Edge, Firefox, Safari.

---

## 📄 License

MIT — free to use, modify, and distribute.
