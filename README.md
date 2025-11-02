<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Neurobridge AI Mental Health Platform

A comprehensive telepsychiatry platform enabling secure communication and care coordination between patients, providers, and mentors. Built with React, TypeScript, Node.js, Express, and PostgreSQL.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Project Structure](#project-structure)
- [Development Status](#development-status)

## Features

### Patient Portal
- View and manage appointments with providers
- Access medical records and session notes
- Book appointments with available providers
- Secure messaging with healthcare providers
- Profile management with HIPAA-compliant data handling

### Provider Dashboard
- Manage patient caseload
- View patient medical history and notes
- Schedule and manage appointments
- Communicate with assigned mentor
- Track availability and appointment statistics

### Mentor Dashboard
- Oversee multiple providers
- Access provider statistics and caseload
- Support and guidance for providers
- HIPAA-compliant audit logging

### Security Features
- JWT-based authentication with refresh tokens
- HIPAA-compliant audit logging
- Role-based access control (RBAC)
- Secure password hashing with bcrypt
- Session persistence and automatic token refresh

## Architecture

### Frontend
- **Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS with dark mode support
- **State Management:** React Hooks (useState, useEffect, useCallback)
- **API Communication:** Custom API client with automatic token refresh
- **Build Tool:** Vite

### Backend
- **Runtime:** Node.js with Express.js
- **Database:** PostgreSQL 12+
- **Authentication:** JWT with bcrypt password hashing
- **API Design:** RESTful with role-based authorization
- **Security:** CORS, helmet, rate limiting

### Data Flow
```
Frontend (React) → API Client (utils/api.ts) → Backend (Express) → Database (PostgreSQL)
                        ↑                              ↓
                   JWT Tokens ← ← ← ← ← ← ← ← ← ← ← ← ←
```

## Getting Started

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   PORT=3001
   DATABASE_URL=postgresql://user:password@localhost:5432/neurobridge_db
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   NODE_ENV=development
   ```

4. **Set up the database:**
   ```bash
   # Create the database
   psql -U postgres -c "CREATE DATABASE neurobridge_db;"

   # Run the schema
   psql -U postgres -d neurobridge_db -f database/schema.sql

   # (Optional) Seed with sample data
   psql -U postgres -d neurobridge_db -f database/seed.sql
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3001`

## Environment Variables

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3001/api` |

### Backend (backend/.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for access tokens | Yes |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |

## Database Setup

The database schema includes:
- **users:** Central user table for all roles (patients, providers, mentors)
- **patients:** Patient-specific information and medical records
- **providers:** Provider profiles and specialties
- **appointments:** Appointment scheduling and management
- **session_notes:** Clinical documentation with digital signatures
- **medications:** Patient medication tracking
- **audit_log:** HIPAA-compliant access logging

### Sample Credentials (from seed.sql)

**Patients:**
- alex.patient@neuro.io / Patient123!

**Providers:**
- dr.evans@neuro.io / Provider123!
- dr.martinez@neuro.io / Provider123!

**Mentors:**
- mentor.thompson@neuro.io / Mentor123!

## API Documentation

Comprehensive API documentation is available in [`backend/API.md`](backend/API.md).

### Key Endpoints

**Authentication:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and receive tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and invalidate tokens
- `GET /auth/me` - Get current user

**Patients:**
- `GET /patients` - List all patients (providers/mentors only)
- `GET /patients/me` - Get current patient profile
- `GET /patients/:id` - Get patient by ID
- `PUT /patients/:id` - Update patient profile

**Providers:**
- `GET /providers` - List all providers
- `GET /providers/available` - Get accepting new patients
- `GET /providers/me` - Get current provider profile
- `GET /providers/:id` - Get provider by ID

**Appointments:**
- `GET /appointments` - List appointments with filters
- `GET /appointments/upcoming` - Get upcoming appointments
- `POST /appointments` - Book new appointment
- `PATCH /appointments/:id/cancel` - Cancel appointment
- `PATCH /appointments/:id/status` - Update appointment status

See [`backend/API.md`](backend/API.md) for complete documentation with request/response examples.

## Authentication

### Token-Based Authentication Flow

1. **Login:** User provides email/password
   - Backend validates credentials
   - Returns access token (15min) and refresh token (7days)
   - Tokens stored in localStorage

2. **Authenticated Requests:**
   - Frontend includes access token in Authorization header
   - Backend validates token and role permissions
   - Returns requested data

3. **Token Refresh:**
   - When access token expires (401 response)
   - Frontend automatically requests new access token using refresh token
   - Original request is retried with new token
   - User remains logged in seamlessly

4. **Logout:**
   - Frontend calls logout endpoint
   - Tokens are invalidated server-side
   - localStorage is cleared

### Session Persistence

Sessions persist across browser refreshes:
- On app mount, frontend checks for existing access token
- If found, attempts to fetch current user
- If successful, user remains logged in
- If token is invalid, user is redirected to login

## Project Structure

```
Neurobridge-AI-Mental-Health-Platform/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and environment config
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── server.ts       # Express app setup
│   ├── database/
│   │   ├── schema.sql      # Database schema
│   │   └── seed.sql        # Sample data
│   └── API.md              # API documentation
├── components/
│   ├── patient/            # Patient-specific components
│   ├── provider/           # Provider-specific components
│   ├── PatientAppWrapper.tsx
│   ├── ProviderDashboardWrapper.tsx
│   └── ...
├── hooks/
│   ├── usePatient.ts       # Patient data hooks
│   ├── useProviders.ts     # Provider data hooks
│   ├── useAppointments.ts  # Appointment data hooks
│   └── ...
├── utils/
│   ├── api.ts              # API client with token management
│   └── ...
├── App.tsx                 # Main app component
└── README.md               # This file
```

## Development Status

### Completed Features

- ✅ User authentication with JWT
- ✅ Session persistence and token refresh
- ✅ Patient portal with appointment booking
- ✅ Provider dashboard with caseload management
- ✅ Appointment scheduling with conflict detection
- ✅ Patient medical records and session notes
- ✅ Provider availability management
- ✅ HIPAA-compliant audit logging
- ✅ Dark mode support
- ✅ Responsive design

### In Progress

- 🚧 Mentor dashboard backend integration
- 🚧 Real-time messaging system
- 🚧 Google Calendar integration for appointments

### Future Enhancements

- 📋 Video consultation integration
- 📋 Document upload and management
- 📋 Prescription management
- 📋 Insurance verification
- 📋 Analytics dashboard for providers
- 📋 Mobile app (React Native)

## Contributing

This is a private medical platform. All contributions must follow HIPAA compliance guidelines and undergo security review.

## License

Proprietary - All rights reserved

## Support

For technical support or questions, please contact the development team.

---

**Note:** This platform handles Protected Health Information (PHI). Ensure all local development environments follow proper security practices, including secure credential storage and encrypted connections in production.
