# EduTrack Backend

EduTrack is a Smart School Curriculum, Attendance, and Academic Management System REST API backend. It is built using Node.js, Express, and MySQL, implementing secure JWT authentication, strict role-based access controls, manual attendance marking, automated timetable conflict validation, study material uploads, assignment grading, and rule-based student risk evaluations.

---

## Technical Stack
- **Runtime Environment**: Node.js (v18+)
- **Web Framework**: Express.js
- **Database**: MySQL (using `mysql2/promise` pool)
- **Authentication**: JSON Web Token (JWT) & `bcryptjs`
- **Request Validation**: `express-validator`
- **File Uploads**: `multer`
- **Security & Utilities**: `helmet`, `cors`, `morgan`, `express-rate-limit`, `dotenv`

---

## Project Structure
```text
backend/
├── database/
│   ├── schema.sql           # Database tables creation script
│   ├── seed.sql             # Standard seed data (users, classes, timetables)
│   └── reset.sql            # Drops and recreates the database
├── scripts/
│   ├── createAdmin.js       # CLI script to seed initial admin from environment variables
│   ├── dbInit.js            # Node script to apply schema.sql and seed.sql to MySQL
│   └── testDatabase.js      # Verifies connection pool connectivity
├── src/
│   ├── config/              # Database pool setup
│   ├── controllers/         # REST request handlers
│   ├── middleware/          # JWT auth, error handling, file uploads, RBAC guards
│   ├── routes/              # Express endpoint registers
│   ├── services/            # Core business and transactional logic
│   ├── utils/               # Formatting, errors, and calculations helpers
│   ├── validators/          # Input body schemas
│   ├── app.js               # Express application initialization
│   └── server.js            # Main HTTP server and process handles
├── tests/                   # Native Node.js automated tests
├── uploads/                 # File uploads subdirectories
└── API_TESTING.md           # API endpoints testing payloads reference
```

---

## Installation & Setup

### 1. Requirements
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL Server](https://dev.mysql.com/downloads/installer/) (v8.0 or higher)

### 2. Install Dependencies
Navigate to the `backend/` directory and install the npm packages:
```bash
cd backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `backend/` directory based on the `.env.example` file.
```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Ansh@2007
DB_NAME=edutrack_db

JWT_SECRET=super_secret_jwt_key_edutrack_2026_dev
JWT_EXPIRES_IN=1d

FRONTEND_URL=http://localhost:5173

ADMIN_NAME=EduTrack Admin
ADMIN_EMAIL=admin@edutrack.local
ADMIN_PASSWORD=adminPassword123

MAX_FILE_SIZE_MB=10
```

### 4. Database Setup & Seeding
EduTrack includes a script to automatically verify MySQL connectivity, create the database, build tables, and inject mock records. Run the following command:
```bash
node scripts/dbInit.js
```
To verify the database connections, run:
```bash
npm run db:test
```

### 5. Seeding Admin Account
To create or verify the primary admin account defined in the environment variables, run:
```bash
npm run seed:admin
```

---

## Running the Application

### Start Development Server (with Nodemon)
```bash
npm run dev
```

### Start Production Server
```bash
npm run start
```
The server will boot by default on port `5000`. The API Base URL will be:
`http://localhost:5000/api`

---

## User Roles & Credentials
There is no public registration. Only the Admin can create profiles. The database seeding script creates the following demo credentials (password for all is `password123`):

| Role | Name | Email | Additional Details |
| :--- | :--- | :--- | :--- |
| **Admin** | EduTrack Admin | `admin@edutrack.local` | Full control |
| **Teacher 1** | John Doe | `teacher1@edutrack.local` | Mathematics Teacher |
| **Teacher 2** | Jane Smith | `teacher2@edutrack.local` | Science Teacher |
| **Student 1** | Student One | `student1@edutrack.local` | Enrolled Grade 9 A (Roll 1) |
| **Student 2** | Student Two | `student2@edutrack.local` | Enrolled Grade 9 A (Roll 2) |
| **Parent 1** | Parent One | `parent1@edutrack.local` | Linked to Students 1 & 2 |

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Authenticate user & get token
- `GET /api/auth/me` - Get current session
- `POST /api/auth/logout` - Clear token session (returns confirmation)
- `PUT /api/auth/change-password` - Update password

### Admin Operations
- `GET/POST/PUT/PATCH /api/admin/teachers` - Manage teacher records
- `GET/POST/PUT/PATCH /api/admin/students` - Manage student records
- `GET/POST/PUT/PATCH /api/admin/parents` - Manage parent records
- `POST /api/admin/parents/link` - Establish child-parent relationships

### Academic Structures
- `GET/POST/PUT /api/academic/sessions` - Academic Years
- `GET/POST/PUT /api/academic/classes` - Classes
- `GET/POST/PUT /api/academic/sections` - Sections
- `GET/POST/PUT /api/academic/subjects` - Course subjects
- `GET/POST/DELETE /api/academic/assignments` - Teacher assignments
- `GET/POST/PUT /api/academic/enrollments` - Student course enrollments

### Attendance Module
- `GET /api/teacher/assignments` - View assigned classes
- `GET /api/attendance/students` - Fetch enrolled class sheets
- `POST /api/attendance` - Log attendance session (Transactional, blocked on duplicates)
- `GET /api/attendance/sessions` - List attendance sessions
- `PUT /api/attendance/records/:recordId` - Correct record (Requires justification, logs to audit log)
- `GET /api/attendance/student/me` - Student views own percentages
- `GET /api/attendance/student/:studentId` - Fetch student percentages (Parent link check enforced)
- `GET /api/attendance/class/:classId` - Get overall class attendance stats

### Study Materials & Assignments
- `GET/POST/PUT/DELETE /api/materials` - Upload and manage PDFs/DOCX/PPTX/Videos files
- `GET/POST/PUT/DELETE /api/assignments` - Assign schoolwork (Fires notifications to students)
- `POST /api/assignments/:id/submissions` - Upload student submission
- `GET /api/assignments/:id/submissions` - Fetch submissions list
- `PUT /api/submissions/:id/evaluate` - Grade submissions and post feedback

### Timetable
- `GET/POST/PUT/DELETE /api/timetable` - Schedule timetable entries (Validates conflicts on rooms/teachers/class sections)
- `GET /api/timetable/me` - Retrieve role-specific timetable

### Reports & Notifications
- `GET /api/reports/admin-dashboard` - Admin summary statistics
- `GET /api/reports/teacher-dashboard` - Teacher summary statistics
- `GET /api/reports/student-dashboard` - Student statistics and schedule
- `GET /api/reports/parent-dashboard` - Parent child report tracker
- `GET /api/reports/performance?classId=1` - Get student risk reports (Rule-based: GOOD, AVERAGE, NEEDS_ATTENTION, AT_RISK)
- `GET /api/notifications` - Retrieve in-app alerts

---

## File Uploads Information
Uploaded files are stored inside subdirectories of the `uploads/` folder:
- **Study Materials / Assignment Attachments**: Saved in `uploads/materials/`
- **Student Submissions**: Saved in `uploads/submissions/`

### Allowed Formats
PDF, DOC, DOCX, PPT, PPTX, PNG, JPEG, WEBP, and GIF (up to 10MB by default).

---

## Testing Commands
To run the automated integration tests natively, execute:
```bash
npm test
```
The test suite validates:
1. API Health responses
2. Successful administrator login
3. Incorrect password rejections
4. Locked route authentication enforcement
5. Duplicate attendance sheets rejection
6. Role authorization restrictions
