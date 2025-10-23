# NeuroBridge Backend API

Backend REST API for the NeuroBridge AI Mental Health Platform.

## Features

- **RESTful API** - Express.js with TypeScript
- **Security** - Helmet, CORS, Rate Limiting
- **Logging** - Winston with file rotation
- **Validation** - Express Validator with Zod schemas
- **Authentication** - JWT-based (to be implemented)
- **Database** - PostgreSQL with connection pooling (to be implemented)
- **HIPAA Compliance** - Audit logging, encryption at rest (planned)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update environment variables with your configuration:
- Database credentials
- JWT secret (generate with: `openssl rand -base64 32`)
- Google API credentials
- SMTP settings

### Development

```bash
npm run dev
```

Server runs on `http://localhost:3001`

### Build

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Authentication
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
```

### Patients
```
GET    /api/patients
GET    /api/patients/:id
PUT    /api/patients/:id
GET    /api/patients/:id/medications
GET    /api/patients/:id/notes
```

### Appointments
```
GET    /api/appointments
POST   /api/appointments
PUT    /api/appointments/:id
DELETE /api/appointments/:id
```

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── logger.ts     # Winston logger setup
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   ├── patient.routes.ts
│   │   └── appointment.routes.ts
│   └── server.ts        # Express app setup
├── logs/                # Log files (gitignored)
├── dist/                # Compiled JavaScript
├── .env.example         # Environment template
├── package.json
└── tsconfig.json
```

## TODO

### Phase 1: Core Features
- [ ] Implement JWT authentication
- [ ] Set up PostgreSQL connection
- [ ] Create database schema
- [ ] Implement user registration/login
- [ ] Add authentication middleware
- [ ] Role-based access control

### Phase 2: Patient Management
- [ ] Patient CRUD operations
- [ ] Medication tracking
- [ ] Allergy management
- [ ] Session notes storage
- [ ] Document upload/storage

### Phase 3: Appointments
- [ ] Google Calendar integration
- [ ] Conflict detection
- [ ] Email notifications
- [ ] SMS reminders
- [ ] Video call links

### Phase 4: Security & Compliance
- [ ] End-to-end encryption
- [ ] Audit logging
- [ ] Data retention policies
- [ ] HIPAA compliance validation
- [ ] Penetration testing

### Phase 5: Advanced Features
- [ ] Real-time messaging (WebSocket)
- [ ] Prescription management
- [ ] Insurance verification
- [ ] Analytics dashboard
- [ ] Export/import data

## Security Notes

⚠️ **IMPORTANT**: This is a foundation for a HIPAA-compliant system but is NOT production-ready:

1. **Authentication**: JWT implementation needed
2. **Database**: Encryption at rest required
3. **Transport**: TLS 1.3 required in production
4. **Audit Logging**: All PHI access must be logged
5. **BAA**: Business Associate Agreement with all vendors
6. **Backups**: Encrypted backups with retention policy

## Contributing

1. Create feature branch from `main`
2. Make changes with tests
3. Run linting: `npm run lint`
4. Submit pull request

## License

MIT
