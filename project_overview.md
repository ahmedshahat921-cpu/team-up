# TeamUp Project Overview

## Project Summary
TeamUp is an academic team formation platform designed for university students. It helps students find teams, manage projects, and collaborate effectively. Core features include project management, real-time chat, task boards, video meetings (Jitsi), idea vault, and AI integration for CV skill extraction and team matching. 

## Main User Roles
Based on the application requirements, there are three primary roles:
1. **Student**: The primary end-users who join teams, upload CVs for skill extraction, and participate in projects.
2. **Employee**: Faculty or staff members who might manage projects or oversee specific activities.
3. **Admin**: System administrators who manage the platform, users, and overall settings.

## Key Modules
- **Authentication**: JWT-based login and registration, with role support.
- **Chat**: Real-time group and private messaging using Socket.io.
- **Profile**: User profiles, including skill management and endorsements.
- **Meetings**: Video meeting integration using Jitsi Meet.
- **Analysis**: Dashboard and statistics for user/project activity.
- **AI Extraction & Matching**: Uses Google Gemini API to extract skills from uploaded CVs and match users to the best-fitting teams.
- **Teams / Projects**: Project creation, team formation, and Kanban task boards.

## Data Models / API Endpoints (High-Level)
- **Users**: Managed via Supabase Auth and a custom profiles table (Reg Number, Role, Name, Skills).
- **Projects**: Manage projects/teams (`/api/projects`).
- **Tasks**: Kanban tasks (`/api/tasks`).
- **Chat**: Messages transferred via WebSockets (Socket.io).
- **AI**: `/api/ai/extract-skills` (CV extraction), `/api/ai/match-teams` (Finding best teams).

## Architecture & Tech Stack
- **Frontend**: React 19, Vite, Framer Motion, Zustand (state management), Socket.io Client, Vanilla CSS (Dark theme, glassmorphism).
- **Backend**: Node.js, Express, Socket.io, JWT.
- **Database**: Supabase (PostgreSQL).
- **AI**: Google Gemini API.

## Change Log
* 2026-04-29: Initial creation of `project_overview.md`.
* 2026-04-29: Replaced default `pdf-parse` import with CJS require format in `backend/src/routes/ai.js` to fix ESM compatibility issue.
* 2026-04-29: Added `missing_skills` to AI matching algorithm in `backend/src/routes/ai.js` and rendered missing skills tags in `frontend/src/pages/Profile.jsx`.
* 2026-04-29: Fixed lazy-loading issue on Analysis page by changing Recharts `ResponsiveContainer` width from 100% to 99% in `frontend/src/pages/Analytics.jsx`.
* 2026-04-29: Rewrote Chat component to be fully real-time and functional using Supabase `private_messages`, including user fetching, optimistic UI, image upload support, and emoji picker in `frontend/src/pages/Chat.jsx`.
* 2026-04-29: Added "Scheduled Meetings" section with a functional "Join Meeting" button in `frontend/src/pages/Dashboard.jsx`.
* 2026-04-30: Fixed Chat page wrong button overlap by conditionally hiding `FloatingWidgets.jsx` when on `/chat` route.
* 2026-04-30: Fixed Chatbot AI endpoint to provide demo responses when no API key is available in `backend/src/routes/ai.js`, ensuring it always responds.
* 2026-04-30: Fixed Notification System by adding Supabase realtime subscriptions in `notificationStore.js` and rendering Approve/Reject buttons for `join_request` types in `Notifications.jsx`.
* 2026-04-30: Updated `users` table constraint and `auth.js` to natively support `admin` and `employee` roles, and updated `Auth.jsx` form to provide all role selection options during signup.
