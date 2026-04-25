# TeamUp – Academic Team Formation Platform

> A full-stack platform for university students to find teams, manage projects, and collaborate effectively.

![TeamUp](https://img.shields.io/badge/TeamUp-Academic_Platform-7c3aed?style=for-the-badge)

## ✨ Features

- **🔐 Authentication** – JWT-based auth with role support (Student, Team Leader, Professor)
- **🤖 AI Integration** – CV skill extraction & team matching via Google Gemini
- **📋 Project Management** – Create/join projects, manage teams, send requests
- **💬 Real-time Chat** – Group & private messaging with Socket.io
- **📊 Task Board** – Drag & drop Kanban board with priorities
- **🎥 Video Meetings** – Jitsi Meet integration with scheduling
- **💡 Idea Vault** – Browse & post project ideas
- **⭐ Skill Endorsements** – Rate teammates, build reputation
- **🔔 Notifications** – Real-time in-app notifications
- **🎨 Modern UI** – Dark theme with purple accents, glassmorphism, animations

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Framer Motion, Zustand, Socket.io Client |
| Backend | Node.js, Express, Socket.io, JWT |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini API |
| Video | Jitsi Meet (free, no account needed) |
| Styling | Vanilla CSS with custom design system |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier)
- (Optional) Google Gemini API key

### 1. Clone the repository
```bash
git clone https://github.com/your-username/team-up.git
cd team-up
```

### 2. Set up the database
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`

### 3. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env` with your Supabase URL, keys, and other credentials.

Also create `frontend/.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=http://localhost:3001
```

And `backend/.env`:
```
PORT=3001
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-key
FRONTEND_URL=http://localhost:5173
```

### 4. Install dependencies & run

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:3001`.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| POST | `/api/projects/:id/request` | Send join request |
| PATCH | `/api/projects/requests/:id` | Accept/reject request |
| GET | `/api/tasks/project/:id` | Get project tasks |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task |
| GET | `/api/notifications` | Get notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| GET | `/api/ideas` | Get all ideas |
| POST | `/api/ideas` | Post idea |
| POST | `/api/ideas/:id/like` | Toggle like |
| POST | `/api/ai/extract-skills` | Extract skills from CV |
| POST | `/api/ai/match-teams` | Get team matches |
| GET | `/api/dashboard` | Dashboard data |

## 🎨 Design

Dark theme with vibrant purple accents, inspired by modern SaaS dashboards:
- Background: Deep navy (`#06061a`)
- Primary: Purple (`#7c3aed`)
- Glassmorphism cards with backdrop blur
- Smooth Framer Motion animations
- Custom cursive typography for hero sections

## 📦 Deployment

- **Frontend**: Deploy to Vercel (`vercel --prod`)
- **Backend**: Deploy to Render/Railway
- **Database**: Already on Supabase cloud

## 📄 License

MIT
