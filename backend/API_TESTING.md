# EduTrack API Testing Guide

This document lists the main API endpoints for the EduTrack backend, their roles, parameters, and example payloads for local testing.

## Base URL
All API requests are prefixed with:
`http://localhost:5000/api`

---

## 1. Authentication APIs

### Login
- **Endpoint**: `POST /auth/login`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "admin@edutrack.local",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": 1,
        "full_name": "EduTrack Admin",
        "email": "admin@edutrack.local",
        "phone": "1234567890",
        "role": "admin",
        "status": "active"
      },
      "token": "eyJhbGciOiJIUzI1..."
    }
  }
  ```

### Change Password
- **Endpoint**: `PUT /auth/change-password`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "oldPassword": "password123",
    "newPassword": "newSecurePassword123"
  }
  ```

---

## 2. Admin CRUD & Operations

### Create Teacher
- **Endpoint**: `POST /admin/teachers`
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "fullName": "Robert Downey",
    "email": "robert@edutrack.local",
    "phone": "1231231234",
    "password": "teacherPassword123",
    "employeeCode": "T-1003",
    "qualification": "M.Sc Physics",
    "joiningDate": "2026-07-27"
  }
  ```

### Link Parent to Student
- **Endpoint**: `POST /admin/parents/link`
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "parentId": 1,
    "studentId": 2,
    "relationship": "Father",
    "isPrimary": true
  }
  ```

---

## 3. Attendance Module

### Fetch Assigned Classes & Subjects
- **Endpoint**: `GET /teacher/assignments`
- **Headers**: `Authorization: Bearer <TEACHER_TOKEN>`

### Submit Manual Attendance
- **Endpoint**: `POST /attendance`
- **Headers**: `Authorization: Bearer <TEACHER_TOKEN>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "classId": 1,
    "sectionId": 1,
    "subjectId": 1,
    "academicSessionId": 1,
    "attendanceDate": "2026-07-27",
    "lectureNumber": 4,
    "startTime": "12:00",
    "endTime": "13:00",
    "records": [
      { "studentId": 1, "status": "present" },
      { "studentId": 2, "status": "absent", "remarks": "Sick leave" },
      { "studentId": 3, "status": "late" }
    ]
  }
  ```

### Correct Attendance Record
- **Endpoint**: `PUT /attendance/records/:recordId`
- **Headers**: `Authorization: Bearer <TEACHER_OR_ADMIN_TOKEN>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "status": "present",
    "correctionReason": "Marked absent by mistake, verified physical presence"
  }
  ```

---

## 4. Academic Performance & Marks

### Record Marks
- **Endpoint**: `POST /marks`
- **Headers**: `Authorization: Bearer <TEACHER_OR_ADMIN_TOKEN>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "examId": 1,
    "studentId": 1,
    "classId": 1,
    "sectionId": 1,
    "subjectId": 1,
    "maximumMarks": 100,
    "marksObtained": 85,
    "remarks": "Excellent essay writing"
  }
  ```

### Get Performance Report (Risk Analysis)
- **Endpoint**: `GET /reports/student-performance/:studentId`
- **Headers**: `Authorization: Bearer <TOKEN>`

---

## 5. Timetable

### Add Timetable Entry (Bocked on double bookings)
- **Endpoint**: `POST /timetable`
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "academicSessionId": 1,
    "classId": 1,
    "sectionId": 1,
    "subjectId": 1,
    "teacherId": 1,
    "dayOfWeek": "Monday",
    "startTime": "09:00",
    "endTime": "10:00",
    "roomNumber": "Room 101"
  }
  ```
