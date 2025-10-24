# NeuroBridge API Documentation

## Authentication

All authentication endpoints use JSON for request/response bodies.

### Base URL
```
http://localhost:3001/api
```

---

## Endpoints

### 1. Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "SecureP@ssw0rd",
  "role": "patient",
  "name": "John Doe",
  "phone": "+1-555-0100",
  "dateOfBirth": "1990-01-15"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character
- Cannot be a common password

**Valid Roles:** `patient`, `provider`, `mentor`

**Success Response:** `201 Created`
```json
{
  "message": "Registration successful",
  "user": {
    "id": 4,
    "email": "patient@example.com",
    "name": "John Doe",
    "role": "patient",
    "createdAt": "2024-10-24T12:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors
- `409 Conflict` - Email already registered

---

### 2. Login

Authenticate existing user.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "alex.patient@neuro.io",
  "password": "password"
}
```

**Success Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "alex.patient@neuro.io",
    "name": "Alex Johnson",
    "role": "patient"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account deactivated

---

### 3. Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token

---

### 4. Logout

Invalidate refresh token.

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response:** `200 OK`
```json
{
  "message": "Logout successful"
}
```

---

### 5. Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "alex.patient@neuro.io",
    "role": "patient",
    "name": "Alex Johnson",
    "phone": "+1-555-0101",
    "date_of_birth": "1992-05-15",
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_login": "2024-10-24T12:00:00.000Z"
  }
}
```

---

## Demo Accounts (from seed data)

All demo accounts use password: `password`

**Patients:**
- alex.patient@neuro.io
- maria.patient@neuro.io
- chen.patient@neuro.io

**Providers:**
- dr.evans@neuro.io
- dr.martinez@neuro.io

**Mentors:**
- mentor.thompson@neuro.io

---

## Using curl

### Register:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecureP@ssw0rd",
    "role": "patient",
    "name": "Test User"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex.patient@neuro.io",
    "password": "password"
  }'
```

### Get Current User:
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Logout:
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

---

## Token Usage

### Access Token
- **Purpose:** Authenticate API requests
- **Lifetime:** 24 hours (configurable)
- **Usage:** Include in `Authorization: Bearer <token>` header

### Refresh Token
- **Purpose:** Obtain new access tokens
- **Lifetime:** 7 days (configurable)
- **Usage:** Send to `/auth/refresh` endpoint
- **Storage:** Secure HTTP-only cookie recommended (not implemented yet)

---

## Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Validation errors, missing fields |
| 401 | Unauthorized | Invalid credentials, expired token |
| 403 | Forbidden | Account deactivated, insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Email already registered |
| 500 | Internal Server Error | Database error, server issue |

---

## Security Notes

### Password Security
- Passwords hashed with bcrypt (12 rounds)
- Never stored in plaintext
- Strength validation enforced

### Token Security
- JWT tokens signed with secret key
- Tokens include user ID, email, role
- Refresh tokens stored in database
- Revoked refresh tokens rejected

### HTTPS Required
In production, all endpoints MUST use HTTPS to prevent:
- Man-in-the-middle attacks
- Token interception
- Credential theft

### Rate Limiting
- 100 requests per 15 minutes per IP
- Applied to all `/api/*` endpoints

---

## Audit Logging

All authentication events are logged:
- User registration
- Login attempts (success/failure)
- Token refresh
- Logout

Logs include:
- User ID
- Timestamp
- IP address
- User agent
- Action performed

---

## Patient Endpoints

All patient endpoints require authentication. Authorization rules apply based on user role.

### 6. List All Patients

Get a list of all patients (providers/mentors only).

**Endpoint:** `GET /patients`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `isActive` (optional): `true` or `false` - Filter by account status
- `search` (optional): Search term for name or email
- `limit` (optional): Number of results (1-100, default 50)
- `offset` (optional): Pagination offset (default 0)

**Success Response:** `200 OK`
```json
{
  "patients": [
    {
      "id": 1,
      "user_id": 1,
      "email": "alex.patient@neuro.io",
      "name": "Alex Johnson",
      "phone": "+1-555-0101",
      "provider_name": "Dr. Sarah Evans",
      "provider_specialty": "Clinical Psychology"
    }
  ],
  "total": 3,
  "limit": 50,
  "offset": 0
}
```

---

### 7. Get Current Patient Profile

Get authenticated patient's own profile.

**Endpoint:** `GET /patients/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** `patient`

**Success Response:** `200 OK`
```json
{
  "patient": {
    "id": 1,
    "email": "alex.patient@neuro.io",
    "name": "Alex Johnson",
    "phone": "+1-555-0101",
    "date_of_birth": "1992-05-15",
    "emergency_contact_name": "Jordan Johnson",
    "emergency_contact_phone": "+1-555-0199",
    "insurance_provider": "BlueCross BlueShield",
    "insurance_policy_number": "BC123456789",
    "medical_history": "Anxiety, depression",
    "allergies": "None",
    "provider_name": "Dr. Sarah Evans"
  }
}
```

---

### 8. Get Patient by ID

Get patient details by ID.

**Endpoint:** `GET /patients/:id`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Authorization:** Patients can only view their own profile. Providers/mentors can view all patients.

**Success Response:** `200 OK`
```json
{
  "patient": {
    "id": 1,
    "name": "Alex Johnson",
    "email": "alex.patient@neuro.io",
    "phone": "+1-555-0101",
    "provider_name": "Dr. Sarah Evans"
  }
}
```

---

### 9. Update Patient Profile

Update patient information.

**Endpoint:** `PUT /patients/:id`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Alex Johnson",
  "phone": "+1-555-0101",
  "emergency_contact_name": "Jordan Johnson",
  "emergency_contact_phone": "+1-555-0199",
  "insurance_provider": "BlueCross BlueShield",
  "insurance_policy_number": "BC123456789",
  "medical_history": "Updated medical history",
  "allergies": "Penicillin"
}
```

**Success Response:** `200 OK`
```json
{
  "message": "Patient updated successfully",
  "patient": {
    "id": 1,
    "name": "Alex Johnson",
    "phone": "+1-555-0101"
  }
}
```

---

### 10. Get Patient Medications

Get list of medications for a patient.

**Endpoint:** `GET /patients/:id/medications`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response:** `200 OK`
```json
{
  "medications": [
    {
      "id": 1,
      "medication_name": "Sertraline",
      "dosage": "50mg",
      "frequency": "Once daily",
      "provider_name": "Dr. Sarah Evans",
      "start_date": "2024-01-15"
    }
  ]
}
```

---

### 11. Get Patient Session Notes

Get clinical session notes for a patient.

**Endpoint:** `GET /patients/:id/notes`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `providerId` (optional): Filter by provider
- `startDate` (optional): Filter notes after this date
- `endDate` (optional): Filter notes before this date
- `limit` (optional): Maximum notes to return (1-100)

**Success Response:** `200 OK`
```json
{
  "sessionNotes": [
    {
      "id": 1,
      "provider_name": "Dr. Sarah Evans",
      "note_type": "Follow-up",
      "session_date": "2024-10-20",
      "assessment": "Patient showing improvement",
      "plan": "Continue current treatment"
    }
  ]
}
```

---

### 12. Get Provider's Patients

Get list of patients assigned to current provider.

**Endpoint:** `GET /patients/provider/my-patients`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** `provider`

**Success Response:** `200 OK`
```json
{
  "patients": [
    {
      "id": 1,
      "name": "Alex Johnson",
      "email": "alex.patient@neuro.io"
    }
  ],
  "count": 3
}
```

---

## Appointment Endpoints

All appointment endpoints require authentication.

### 13. List Appointments

Get appointments with optional filters.

**Endpoint:** `GET /appointments`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `patientId` (optional): Filter by patient ID
- `providerId` (optional): Filter by provider ID
- `status` (optional): `scheduled`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`
- `appointmentType` (optional): `initial_consultation`, `follow_up`, `therapy_session`, `medication_review`, `crisis_intervention`
- `startDate` (optional): Filter appointments after this date
- `endDate` (optional): Filter appointments before this date
- `limit` (optional): Number of results (1-100, default 50)
- `offset` (optional): Pagination offset

**Success Response:** `200 OK`
```json
{
  "appointments": [
    {
      "id": 1,
      "patient_name": "Alex Johnson",
      "provider_name": "Dr. Sarah Evans",
      "appointment_type": "therapy_session",
      "scheduled_start": "2024-10-25T14:00:00Z",
      "scheduled_end": "2024-10-25T15:00:00Z",
      "status": "scheduled"
    }
  ],
  "total": 5,
  "limit": 50,
  "offset": 0
}
```

---

### 14. Get Upcoming Appointments

Get upcoming appointments for current user.

**Endpoint:** `GET /appointments/upcoming`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (optional): Maximum appointments to return

**Success Response:** `200 OK`
```json
{
  "appointments": [
    {
      "id": 1,
      "patient_name": "Alex Johnson",
      "provider_name": "Dr. Sarah Evans",
      "scheduled_start": "2024-10-25T14:00:00Z",
      "status": "scheduled"
    }
  ],
  "count": 2
}
```

---

### 15. Get Appointment History

Get past appointments (patient only).

**Endpoint:** `GET /appointments/history`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** `patient`

**Success Response:** `200 OK`
```json
{
  "appointments": [
    {
      "id": 5,
      "provider_name": "Dr. Sarah Evans",
      "scheduled_start": "2024-10-20T14:00:00Z",
      "status": "completed"
    }
  ],
  "count": 10
}
```

---

### 16. Get Appointment by ID

Get appointment details.

**Endpoint:** `GET /appointments/:id`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response:** `200 OK`
```json
{
  "appointment": {
    "id": 1,
    "patient_name": "Alex Johnson",
    "provider_name": "Dr. Sarah Evans",
    "appointment_type": "therapy_session",
    "scheduled_start": "2024-10-25T14:00:00Z",
    "scheduled_end": "2024-10-25T15:00:00Z",
    "status": "scheduled",
    "notes": "Initial therapy session"
  }
}
```

---

### 17. Book Appointment

Create a new appointment.

**Endpoint:** `POST /appointments`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "providerId": 1,
  "appointmentType": "therapy_session",
  "scheduledStart": "2024-10-25T14:00:00Z",
  "scheduledEnd": "2024-10-25T15:00:00Z",
  "googleCalendarEventId": "event123",
  "notes": "Initial session"
}
```

**Notes:**
- Patients book for themselves automatically
- Providers/mentors can include `patientId` to book for others
- System checks for scheduling conflicts
- Cannot book appointments in the past

**Success Response:** `201 Created`
```json
{
  "message": "Appointment created successfully",
  "appointment": {
    "id": 10,
    "patient_name": "Alex Johnson",
    "provider_name": "Dr. Sarah Evans",
    "scheduled_start": "2024-10-25T14:00:00Z",
    "status": "scheduled"
  }
}
```

**Error Responses:**
- `409 Conflict` - Provider has a scheduling conflict

---

### 18. Update Appointment

Modify an existing appointment.

**Endpoint:** `PUT /appointments/:id`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "scheduledStart": "2024-10-25T15:00:00Z",
  "scheduledEnd": "2024-10-25T16:00:00Z",
  "notes": "Rescheduled"
}
```

**Success Response:** `200 OK`
```json
{
  "message": "Appointment updated successfully",
  "appointment": {
    "id": 1,
    "scheduled_start": "2024-10-25T15:00:00Z",
    "scheduled_end": "2024-10-25T16:00:00Z"
  }
}
```

---

### 19. Update Appointment Status

Update appointment status (provider only).

**Endpoint:** `PATCH /appointments/:id/status`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** `provider`

**Request Body:**
```json
{
  "status": "completed"
}
```

**Valid Statuses:**
- `scheduled`
- `confirmed`
- `in_progress`
- `completed`
- `cancelled`
- `no_show`

**Success Response:** `200 OK`
```json
{
  "message": "Appointment status updated successfully",
  "appointment": {
    "id": 1,
    "status": "completed"
  }
}
```

---

### 20. Cancel Appointment

Cancel an appointment with reason.

**Endpoint:** `POST /appointments/:id/cancel`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "cancellationReason": "Patient requested reschedule due to conflict"
}
```

**Success Response:** `200 OK`
```json
{
  "message": "Appointment cancelled successfully",
  "appointment": {
    "id": 1,
    "status": "cancelled",
    "cancellation_reason": "Patient requested reschedule due to conflict"
  }
}
```

---

### 21. Delete Appointment

Permanently delete appointment (admin only).

**Endpoint:** `DELETE /appointments/:id`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** `mentor`

**Success Response:** `200 OK`
```json
{
  "message": "Appointment deleted successfully"
}
```

---

## Using curl Examples

### List Patients (Provider):
```bash
curl -X GET http://localhost:3001/api/patients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Current Patient Profile:
```bash
curl -X GET http://localhost:3001/api/patients/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Book Appointment:
```bash
curl -X POST http://localhost:3001/api/appointments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": 1,
    "appointmentType": "therapy_session",
    "scheduledStart": "2024-10-25T14:00:00Z",
    "scheduledEnd": "2024-10-25T15:00:00Z",
    "notes": "Initial therapy session"
  }'
```

### Get Upcoming Appointments:
```bash
curl -X GET http://localhost:3001/api/appointments/upcoming \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Cancel Appointment:
```bash
curl -X POST http://localhost:3001/api/appointments/1/cancel \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cancellationReason": "Schedule conflict"}'
```

---

## Next Steps

### Implement:
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, Apple)
- [ ] Session management UI
- [ ] Account recovery
- [ ] Provider availability calendar
- [ ] Real-time messaging between patients and providers
- [ ] Video conferencing integration
- [ ] Prescription management
