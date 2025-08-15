# Finovate Dashboard

A modern, offline-first **Personal Finance Tracker** with a **dark + neon** look, built using **only HTML, CSS, and vanilla JavaScript**. No frameworks, no backend. Data persists in **LocalStorage**. Includes responsive UI, filters, CSV export, and Canvas-based neon charts.

## 🎨 What’s New in Neon
- Dark background with cyan/purple neon accents and glow effects
- Redesigned hero, KPI cards with icons
- Canvas charts with neon colors + glow
- Still zero external dependencies

## ✨ Features
- Add, edit, delete expenses (date, amount, category, notes)
- LocalStorage persistence (offline capable)
- Filters: date range, category, min/max amount, search notes
- KPI cards: total, entries, top category
- Charts: Pie (by category), Line (spending over time) — Canvas API
- Dark/Light theme toggle with persistence
- Export to CSV
- Responsive layout + mobile menu

## 🗂️ Structure
```
finance-tracker-neon/
├── index.html
├── style.css
├── script.js
└── assets/
    ├── wallet.svg
    ├── chart.svg
    ├── bag.svg
    ├── stack.svg
    └── hero-graph.svg
```

## 🚀 Run & Deploy
Open `index.html` in a modern browser or push to GitHub Pages (Settings → Pages → Deploy from `main` → `/root`).

## 🔒 Notes
This app stores data in your browser only (LocalStorage). Clearing site data removes expenses.
