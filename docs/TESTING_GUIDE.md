# NeuroBridge End-to-End Testing Guide

## Overview

This guide walks you through testing the entire NeuroBridge platform from start to finish.

---

## Prerequisites

### 1. Backend Running
```bash
cd backend
npm run start:dev
```

Backend should be running at: http://localhost:3000
API docs available at: http://localhost:3000/api

### 2. Frontend Running
```bash
# From project root
npm run dev
```

Frontend should be running at: http://localhost:5173

### 3. Database Seeded

```bash
cd backend
npx prisma db seed
```

This creates sample users:
- **Provider**: provider@test.com / password
- **Patient1**: patient1@test.com / password
- **Patient2**: patient2@test.com / password
- **Patient3**: patient3@test.com / password
- **Mentor**: mentor@test.com / password

---

## Test Scenarios

### ✅ Test 1: Provider Login & Patient List

**Steps:**
1. Open http://localhost:5173
2. Login with: `provider@test.com` / `password`
3. Accept HIPAA disclaimer
4. Verify provider dashboard loads
5. Check that patient list shows 3 patients
6. Verify patient names, diagnoses, and alert statuses display

**Expected Results:**
- ✅ Login successful
- ✅ HIPAA modal appears
- ✅ Dashboard shows "My Caseload" with 3 patients
- ✅ Each patient shows name and primary diagnosis
- ✅ Alert indicators show (green/orange/red dots)

**API Endpoint Tested:**
- POST `/auth/login`
- GET `/patients/provider/{providerId}`

---

### ✅ Test 2: View Patient Details

**Steps:**
1. Click on first patient in the list
2. Verify patient detail view loads
3. Check that medications list appears
4. Check that diagnoses appear
5. Check that allergies appear
6. Check provider schedule/calendar

**Expected Results:**
- ✅ Patient name and demographics displayed
- ✅ Active medications list with dosages
- ✅ Diagnoses with ICD-10 codes
- ✅ Allergies with severity levels
- ✅ Points/gamification summary

**API Endpoint Tested:**
- GET `/patients/{id}`

---

### ✅ Test 3: Add Medication

**Steps:**
1. While viewing a patient, click "Add Medication"
2. Enter medication details:
   - Name: "Sertraline"
   - Dosage: "50mg"
   - Frequency: "Daily"
3. Click "Add"
4. Verify medication appears in list

**Expected Results:**
- ✅ Medication form opens
- ✅ Form validates required fields
- ✅ Medication saves successfully
- ✅ New medication appears in patient's medication list
- ✅ Status shows "ACTIVE"

**API Endpoint Tested:**
- POST `/medications`

---

### ✅ Test 4: AI Medication Safety Analysis

**Steps:**
1. While adding a medication, click "Analyze Safety"
2. Wait for AI response (requires GEMINI_API_KEY)
3. Review safety alerts
4. Check safety score (1-10)
5. Review drug interactions

**Expected Results:**
- ✅ Loading spinner appears
- ✅ Safety analysis returns within 2-3 seconds
- ✅ Safety score displayed (1-10)
- ✅ Interaction warnings shown (if any)
- ✅ Recommendations provided

**API Endpoint Tested:**
- POST `/ai/medication-suggestions`

**Note:** Requires `GEMINI_API_KEY` in backend/.env

---

### ✅ Test 5: Patient Login & Dashboard

**Steps:**
1. Logout from provider account
2. Login with: `patient1@test.com` / `password`
3. Verify patient dashboard loads
4. Check points display
5. Check achievements
6. View profile

**Expected Results:**
- ✅ Patient dashboard loads
- ✅ Welcome message shows patient's first name
- ✅ Points total displayed
- ✅ Quick actions visible (Schedule, Messages)
- ✅ Review prompt shows (if pending reviews exist)

**API Endpoint Tested:**
- POST `/auth/login`
- GET `/patients/{id}`
- GET `/gamification/summary/{patientId}`

---

### ✅ Test 6: Patient Onboarding

**Steps:**
1. Register a new patient (or use patient with `onboardingComplete: false`)
2. Complete onboarding steps
3. Verify 100 points awarded
4. Check onboarding status updated

**Expected Results:**
- ✅ Onboarding wizard appears
- ✅ Multi-step process guides patient
- ✅ Upon completion, 100 points awarded
- ✅ Dashboard appears after completion

**API Endpoint Tested:**
- PATCH `/patients/{id}/onboarding`
- POST `/gamification/track-event`

---

### ✅ Test 7: Session Review

**Steps:**
1. As patient, navigate to "Review" section
2. Submit session review:
   - Rating: 5 stars
   - Feedback: "Great session!"
   - Would recommend: Yes
3. Submit review
4. Verify 50 points awarded

**Expected Results:**
- ✅ Review form displays
- ✅ Rating stars interactive
- ✅ Feedback textarea available
- ✅ Submit button active
- ✅ 50 points added to total
- ✅ Success notification shows

**API Endpoint Tested:**
- POST `/patients/{id}/session-review`

---

### ✅ Test 8: Mentor Dashboard

**Steps:**
1. Logout and login as mentor@test.com
2. View mentor dashboard
3. Check list of mentees (providers)
4. View mentee patients
5. Check chart audits

**Expected Results:**
- ✅ Mentor dashboard loads
- ✅ Mentees (providers) list displayed
- ✅ Each mentee shows patient count
- ✅ Chart audits accessible
- ✅ Summary stats visible

**API Endpoint Tested:**
- GET `/mentors/{id}`
- GET `/mentors/{id}/mentees`
- GET `/mentors/{id}/summary`

---

### ✅ Test 9: Assign Provider to Mentor

**Steps:**
1. As mentor, click "Assign Provider"
2. Select a provider from dropdown
3. Click "Assign"
4. Verify provider appears in mentee list
5. Check provider's mentor field updated

**Expected Results:**
- ✅ Provider dropdown populates
- ✅ Assignment succeeds
- ✅ Mentee list refreshes automatically
- ✅ Success notification appears

**API Endpoint Tested:**
- POST `/mentors/{id}/assign-provider`

---

### ✅ Test 10: Gamification - Track Event

**Steps:**
1. As patient, complete an action (e.g., daily check-in)
2. Verify points awarded
3. Check gamification event logged
4. View recent events list

**Expected Results:**
- ✅ Event tracked successfully
- ✅ Points added to total
- ✅ Event appears in recent activity
- ✅ Point animation/feedback shown

**API Endpoint Tested:**
- POST `/gamification/track-event`
- GET `/gamification/summary/{patientId}`

---

## API Testing with cURL

### 1. Get Auth Token

```bash
# Login and extract token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"provider@test.com","password":"password"}' \
  | jq -r '.token'

# Save token for subsequent requests
export TOKEN="your-jwt-token-here"
```

### 2. Get Patient List

```bash
curl -X GET http://localhost:3000/patients \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### 3. Get Specific Patient

```bash
curl -X GET http://localhost:3000/patients/PATIENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### 4. Add Medication

```bash
curl -X POST http://localhost:3000/medications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PATIENT_ID",
    "name": "Sertraline",
    "dosage": "50mg",
    "frequency": "Daily",
    "startDate": "2025-01-20"
  }' \
  | jq
```

### 5. AI Medication Analysis

```bash
curl -X POST http://localhost:3000/ai/medication-suggestions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PATIENT_ID",
    "proposedMedication": {
      "name": "Sertraline",
      "dosage": "50mg",
      "frequency": "daily"
    }
  }' \
  | jq
```

### 6. Complete Onboarding

```bash
curl -X PATCH http://localhost:3000/patients/PATIENT_ID/onboarding \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### 7. Submit Session Review

```bash
curl -X POST http://localhost:3000/patients/PATIENT_ID/session-review \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "feedback": "Great session!",
    "wouldRecommend": true,
    "sessionId": "SESSION_ID"
  }' \
  | jq
```

### 8. Get Gamification Summary

```bash
curl -X GET http://localhost:3000/gamification/summary/PATIENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### 9. Get Mentor's Mentees

```bash
curl -X GET http://localhost:3000/mentors/MENTOR_ID/mentees \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### 10. Assign Provider to Mentor

```bash
curl -X POST http://localhost:3000/mentors/MENTOR_ID/assign-provider \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"providerId": "PROVIDER_ID"}' \
  | jq
```

---

## Performance Testing

### Check API Response Times

```bash
# Test patient endpoint response time
curl -w "\nTime: %{time_total}s\n" \
  -X GET http://localhost:3000/patients \
  -H "Authorization: Bearer $TOKEN" \
  -o /dev/null -s
```

**Expected:** < 200ms

### Load Test with Apache Bench

```bash
# Install apache bench (if needed)
# macOS: brew install httpd
# Linux: apt-get install apache2-utils

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/patients
```

**Expected:**
- 95th percentile: < 300ms
- No failed requests

---

## Troubleshooting

### Error: "Unauthorized" (401)

**Cause:** Missing or invalid JWT token

**Solution:**
1. Get new token via `/auth/login`
2. Ensure token is in `Authorization: Bearer <token>` header
3. Check token hasn't expired (7 days by default)

### Error: "Not Found" (404)

**Cause:** Invalid endpoint or resource ID

**Solution:**
1. Verify endpoint URL matches backend routes
2. Check resource ID exists in database
3. Review API docs at `/api`

### Error: "Internal Server Error" (500)

**Cause:** Backend error (database, validation, etc.)

**Solution:**
1. Check backend logs: `npm run start:dev`
2. Verify database connection
3. Ensure Prisma migrations run: `npx prisma migrate deploy`

### AI Endpoint Returns Error

**Cause:** Missing `GEMINI_API_KEY` or API quota exceeded

**Solution:**
1. Add API key to `backend/.env`:
   ```
   GEMINI_API_KEY="AIza..."
   ```
2. Restart backend: `npm run start:dev`
3. Check API quota at: https://aistudio.google.com

### Database Connection Failed

**Cause:** PostgreSQL not running or wrong DATABASE_URL

**Solution:**
```bash
# Start PostgreSQL with Docker
docker run -d --name neurobridge-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=user \
  -e POSTGRES_DB=neurobridge \
  -p 5432:5432 postgres:15

# Verify connection
npx prisma db execute --stdin <<< "SELECT 1"
```

---

## Success Criteria

✅ **All 10 test scenarios pass**
✅ **No console errors in browser or backend**
✅ **API response times < 200ms (p95)**
✅ **Database queries optimized (no N+1 queries)**
✅ **Authentication working for all user roles**
✅ **Real-time UI updates after mutations**
✅ **Loading states and error messages display properly**
✅ **Gamification points awarded correctly**

---

## Next Steps After Testing

1. **Fix any bugs found** during testing
2. **Optimize slow queries** (use Prisma Studio to inspect)
3. **Add integration tests** for critical flows
4. **Setup CI/CD** to run tests automatically
5. **Deploy to staging** for user acceptance testing

---

## Summary

This testing guide covers:
- ✅ 10 end-to-end test scenarios
- ✅ API testing with cURL examples
- ✅ Performance benchmarking
- ✅ Troubleshooting common issues
- ✅ Success criteria checklist

**Time to complete:** ~30-45 minutes

**Ready to test?** Start with Test 1 and work through each scenario! 🚀
