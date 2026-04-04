# HostelOS — New Backend API Routes Required

## Admin Auth Routes (NEW — add to your Express server)

### POST /api/auth/admin/signup
Request:  { name, email, password }
Response: { employeeId: "EMP-2024-XXX", message: "OTP sent" }
- Generate random employeeId (EMP-YEAR-XXX format)
- Hash password with bcrypt
- Store admin in a separate `admins` collection/table
- Send OTP email to admin email
- Respond with generated employeeId so frontend can show it

### POST /api/auth/admin/verify-otp
Request:  { email, otp }
Response: { token, user: { id, name, email, employeeId, role:"admin" } }
- Verify OTP from admins collection
- Mark admin as verified
- Return JWT with role:"admin"

### POST /api/auth/admin/login
Request:  { employeeId, password }
Response: { token, user: { id, name, email, employeeId, role:"admin" } }
- Look up admin by employeeId
- Verify password
- Return JWT signed with role:"admin"

### POST /api/auth/admin/forgot-password
Request:  { employeeId }
Response: { message: "OTP sent to registered email" }
- Find admin by employeeId
- Send OTP to their registered email
- Do NOT reveal the email address in response (security)

### POST /api/auth/admin/reset-password
Request:  { employeeId, otp, newPassword }
Response: { message: "Password updated" }
- Verify OTP for that employeeId's email
- Update password

### GET /api/auth/admin/profile
Headers: Authorization: Bearer <token>
Response: { admin: { id, name, email, employeeId, role:"admin" } }
- Return admin profile (used for session hydration)

## Admin Dashboard Routes (REAL DATA)

### GET /api/admin/stats
Response: {
  stats: {
    totalStudents,      // count from users/students collection
    activeComplaints,   // complaints where status != "resolved"
    pendingLeaves,      // leaves where status == "pending"
    messAttendanceToday,// today's mess attendance percentage
    pendingFees,        // students with due fees
    openRooms           // rooms with vacancies
  }
}

### GET /api/admin/students
Response: { students: [{ id, username, name, email, roomNumber, year, createdAt, verified }] }

### GET /api/complaints/all
Response: { complaints: [{ id, title, category, description, status, priority, createdAt, student: { username, room } }] }

### GET /api/leave/all  (or /api/admin/leaves)
Response: { leaves: [{ id, type, from, to, reason, status, student: { username, name } }] }

### POST /api/leave/:id/approve
Response: { message: "Approved" }

### POST /api/leave/:id/reject
Response: { message: "Rejected" }

### POST /api/admin/predict-priority  (Gemini)
Request:  { complaint: { title, description, category } }
Response: { priority: "high"|"medium"|"low", reasoning: "..." }
- Call Gemini API with complaint text
- Return AI-predicted priority

### POST /api/admin/complaint-summary  (Gemini)
Request:  { dateFrom, dateTo }
Response: { summary: "..." }

### POST /api/admin/food-summary  (Gemini)
Request:  { days: 7 }
Response: { analysis: "..." }

## JWT Token
- Admin JWTs should include: { id, role: "admin", employeeId }
- Student JWTs: { id, role: "student" }
- Middleware should check role for admin-only routes

## EmployeeId Format
Generate as: `EMP-${year}-${String(Math.floor(Math.random()*900)+100)}`
Example: EMP-2024-042
