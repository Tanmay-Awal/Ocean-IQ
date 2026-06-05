# 💻 OceanIQ: React + Vite Frontend App

This is the client-side SPA (Single Page Application) for **OceanIQ**, built on a ultra-fast **Vite** runtime with **React (v19)**. The interface is custom styled with **Tailwind CSS (v4)**, featuring high-fidelity micro-interactions, premium CSS layouts, modern typing animations, and fully responsive dashboards.

---

## 🎨 Major Features & Interfaces

The frontend implements three key router views under `react-router-dom`:

1. **Dashboard Home (`/`)**:
   - Implements a stunning immersive background video overlay.
   - Core Call-To-Action buttons redirecting to the Conversational Chat or the external Streamlit data dashboard.
   - Interactive grids showcasing statistical insights on Ocean Economic Impact, Climate Impact, and Marine Biodiversity.
   - High-fidelity **System Architecture** visual board showing the data pipeline at a glance.

2. **Conversational AI Chat Workspace (`/chat`)**:
   - **Collapsible Sidebar**: Tracks recent chats, history archives, and provides a "New Chat" button to restart sessions.
   - **Main Chat Window**: Chat bubble threads featuring typing indicator scripts, beautiful markdown layouts, and direct integration with Flask plotting APIs.
   - **Interactive Graph Display**: Auto-renders dynamically generated graphs (served straight from the backend) inside the chat viewport.
   - **Gemini Thinking Mode Switch**: A quick toggle allowing users to request high-precision deep reasoning outputs directly from the Google Gemini model instead of local/fallback LLMs.
   - **Smart Chat Memory Threshold**: Restricts conversations to `10` interactions maximum per session to maintain high performance and context budget constraints.

3. **Information Intro (`/intro`)**:
   - Detailed introductory guides for first-time oceanography student onboarding.

---

## ⚙️ Key NPM Libraries & Dependencies

- **State Management**: `@reduxjs/toolkit` and `react-redux` are integrated to handle globally shared state variables (e.g., active panels, settings).
- **APIs & Feeds**: Native `fetch` with `AbortController` handles backend data feeds asynchronously, with capability to gracefully cancel requests mid-generation.
- **Routing**: `react-router-dom` (v7) handles fast sub-page transitions without full page reloads.
- **Micro-interactions & Celebrations**: `react-confetti` provides delightful UI animations upon successful target goals.
- **Post-processors**: `postcss` and `@tailwindcss/postcss` build and compile the premium styling sheets into light, production-ready assets.

---

## 🛠️ Local Development Setup

To get the client interface running on your computer, complete the following commands:

### 1. Install dependencies
From the `frontend` folder directory:
```bash
npm install
```

### 2. Launch the Vite local dev server
Runs the application on the default local preview URL (usually [http://localhost:5173](http://localhost:5173)):
```bash
npm run dev
```

### 3. Build for Production
Compiles optimized HTML, CSS, and JS bundle files inside the `dist` directory, fully prepared for Vercel, Netlify, or Static hosting services:
```bash
npm run build
```

---

## 📂 Project Directory Structure

```bash
frontend/
├── public/                 # Static assets (favicons, logos)
├── src/
│   ├── assets/             # Global media files, videos, and backgrounds
│   ├── components/         # Modular reusable React UI views
│   │   ├── Sidebar/        # Sidebar, history archives, and lists
│   │   │   ├── Main/       # Main chat viewport, text inputs, toggle widgets
│   │   │   └── Sidebar.jsx # Navigation control panel
│   │   ├── Intro.jsx       # Introductory overview pages
│   │   └── UserHeader.jsx  # Hero landing page dashboard with video backgrounds
│   ├── config/             # Environment level configuration properties
│   ├── context/            # React Context Provider managing active API payloads
│   │   └── Context.jsx     # Core chat state, API handlers, typing delays
│   ├── App.css             # Main stylesheet
│   ├── App.jsx             # React router declaration file
│   ├── index.css           # Global typography, color tokens, scrollbars
│   └── main.jsx            # Project entrypoint mounting React onto the DOM
├── package.json            # Configuration dependencies and custom scripts
├── postcss.config.cjs      # PostCSS processor settings
├── tailwind.config.js      # Utility-first configuration properties
└── vite.config.js          # Fast compiler parameters
```
