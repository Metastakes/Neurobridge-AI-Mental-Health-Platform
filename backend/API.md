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

## Next Steps

### Implement:
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, Apple)
- [ ] Session management UI
- [ ] Account recovery
