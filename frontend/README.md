# EduTrack Frontend

EduTrack is a responsive, modern school curriculum, attendance, and academic management system web application built with **React, Vite, Tailwind CSS, React Router, and Axios**.

---

## Technical Stack
- **Framework**: React 18 (with Vite)
- **Styling**: Tailwind CSS v3
- **Routing**: React Router v6
- **HTTP Client**: Axios (with Bearer Token interceptors)
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Charts**: Recharts

---

## Project Structure
```text
frontend/
├── API_MAPPING.md          # Comprehensive matrix mapping frontend features to backend endpoints
├── src/
│   ├── api/                # Axios client and modular API endpoints
│   ├── components/
│   │   ├── common/         # Buttons, inputs, modals
│   │   ├── feedback/       # Loading screen, alerts
│   │   └── layout/         # DashboardLayout, Sidebar, TopNavbar, UserMenu
│   ├── context/            # AuthContext (JWT session restoration, state management)
│   ├── layouts/            # Role-specific layouts (Admin, Teacher, Student, Parent, Auth)
│   ├── pages/              # Login, Profile, ChangePassword, Role Dashboards
│   ├── routes/             # Protected, PublicOnly, and Role-Based Guards
│   ├── utils/              # Token storage helpers
│   ├── App.jsx
│   └── main.jsx
├── .env
├── .env.example
├── package.json
└── README.md
```

---

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Variables**:
   Verify `.env` has the backend URL:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The frontend will run locally on `http://localhost:5173`.

4. **Build Production Bundle**:
   ```bash
   npm run build
   ```

---

## Authentication & Route Protection Flow

1. **JWT Storage**:
   - The JWT access token is stored in `localStorage` via `src/utils/tokenStorage.js`.
   - Sensitive user records, passwords, and secrets are never persisted in storage.

2. **Session Restoration**:
   - On page refresh, `AuthContext` calls `GET /api/auth/me`.
   - If valid, the user state is restored. If invalid or expired (401), the token is cleared.

3. **Role Routing**:
   - `admin` → `/admin/dashboard`
   - `teacher` → `/teacher/dashboard`
   - `student` → `/student/dashboard`
   - `parent` → `/parent/dashboard`
