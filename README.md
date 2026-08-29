# PixelCoders — AI SVG Icon Generator

An AI-powered web application that generates clean, scalable SVG icons from natural language descriptions. Describe any icon, choose a style, and get a production-ready SVG in seconds.

## ✨ Features

- **AI Icon Generation** — Describe any icon in natural language and let AI generate a vector SVG from your idea.
- **Fill & Stroke Styles** — Generate icons as solid filled vectors or clean outline SVGs.
- **Customizable Size & Complexity** — Adjust viewBox dimensions, complexity level, and corner style.
- **SVG Code Viewer** — Inspect the generated SVG markup directly.
- **Copy & Download** — Copy SVG code to clipboard or download the file instantly.
- **Generation History** — Browse, revisit, and manage previously generated icons.
- **Auth & Protected Routes** — Email/password login with form validation (Zod), remember me, and protected dashboard.

## 🛠️ Tech Stack

| Layer      | Technology                  |
| ---------- | --------------------------- |
| Framework  | React 19                    |
| Language   | TypeScript 6                |
| Build Tool | Vite 5                      |
| Routing    | React Router DOM 7          |
| State      | Redux Toolkit + React-Redux |
| Styling    | TailwindCSS 3 + Sass (SCSS) |
| Validation | Zod                         |
| Linting    | Oxlint                      |
| AI Proxy   | OpenRouter API              |

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Install

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root. You will need an [OpenRouter](https://openrouter.ai) API key:

```
VITE_OPENROUTER_API_KEY=your_key_here
```

### Development

```bash
npm run dev
```

The app runs at [http://localhost:5173](http://localhost:5173) by default. The Vite dev server proxies `/api/openrouter` requests to the OpenRouter API.

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## 📁 Project Structure

```
src/
├── components/
│   ├── common/          # Shared UI components (Button, Input)
│   └── svg/             # SVG-specific components (Preview, CodeViewer, Actions)
├── features/
│   ├── landing/         # Public landing page, header, footer, hero preview
│   ├── auth/            # Login page and auth service
│   └── icon-generator/  # Dashboard, prompt panel, result panel, history panel
├── hooks/               # Custom hooks (useAppDispatch, useAppSelector)
├── layouts/             # Layout wrappers (DashboardLayout)
├── routes/              # Route guards (ProtectedRoute, PublicRoute)
├── services/            # API service layer
├── store/               # Redux store and slices (auth, generator)
├── styles/              # Global styles
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## 📄 Routes

| Path         | Access                       | Description              |
| ------------ | ---------------------------- | ------------------------ |
| `/`          | Public                       | Landing page             |
| `/demo`      | Public                       | Interactive demo preview |
| `/login`     | Public (redirects if authed) | Email/password login     |
| `/dashboard` | Protected                    | Icon generator workspace |

## Environment Setup

After cloning the project, create a `.env` file in the project root.

You can use `.env.example` as a template:

```bash
cp .env.example .env
```
