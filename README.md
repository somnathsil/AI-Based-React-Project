# 🚀 AI Based React Project

A modern, enterprise-grade AI SaaS dashboard built with React, TypeScript, and Tailwind CSS. Features authentication and a beautiful dark-themed dashboard.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

## ✨ Features

- 🔐 **Authentication** - Secure login with JWT token support
- 📊 **Dashboard** - Real-time metrics and activity monitoring
- 🎨 **Modern UI** - Dark theme with smooth animations
- 📱 **Responsive** - Mobile-first design
- ⚡ **Performance** - Optimized with Vite build tool

## 🛠️ Tech Stack

| Technology      | Purpose           |
| --------------- | ----------------- |
| React 19        | UI Framework      |
| TypeScript      | Type Safety       |
| Tailwind CSS 4  | Styling           |
| Redux Toolkit   | State Management  |
| React Router 7  | Routing           |
| React Hook Form | Form Handling     |
| Zod             | Schema Validation |
| Axios           | HTTP Client       |
| Lucide Icons    | Icon System       |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/antigravity-ai-saas.git

# Navigate to project directory
cd antigravity-ai-saas

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The app will open at [http://localhost:5173](http://localhost:5173)

## 🔑 Demo Credentials

For testing the demo authentication:

| Field    | Value                  |
| -------- | ---------------------- |
| Email    | `admin@mailinator.com` |
| Password | `123456`               |

> ⚠️ **Note**: This is a demo project with static credentials. For production, integrate with a real authentication backend.

## 📜 Available Scripts

| Command              | Description                  |
| -------------------- | ---------------------------- |
| `npm run dev`        | Start development server     |
| `npm run build`      | Build for production         |
| `npm run preview`    | Preview production build     |
| `npm run type-check` | Run TypeScript type checking |

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── common/        # Error boundaries, loaders
│   ├── layout/        # Header, Sidebar, Navigation
│   └── ui/            # Button, Card, Input, Badge
├── features/          # Feature modules
│   ├── ai/            # AI Chat interface
│   ├── auth/          # Authentication forms
│   └── dashboard/     # Dashboard components
├── hooks/             # Custom React hooks
├── layouts/           # Page layouts
├── pages/             # Route pages
├── routes/            # Routing configuration
├── services/          # API services
├── store/             # Redux store
├── styles/            # Global styles
└── types/             # TypeScript types
```

## 🔧 Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=https://api.aisaas.example.com/v1
VITE_APP_TITLE=Antigravity AI SaaS Platform
VITE_ENABLE_ANALYTICS=false
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Vite](https://vitejs.dev/)
