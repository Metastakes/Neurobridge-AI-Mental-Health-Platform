# SMS & Email Emergency Notifications

## Overview

The NeuroBridge platform includes SMS and Email fallback notifications to ensure providers receive critical alerts even when offline. This system automatically triggers when providers are not connected to the WebSocket notification server.

## How It Works

```
Crisis Detection → Event Emission → WebSocket Notification
                                            ↓
                                    Provider Offline?
                                            ↓
                                        ↙      ↘
                                   Send SMS   Send Email
```

### Notification Flow

1. **Crisis Detection Worker** detects a crisis and emits `crisis.detected` event
2. **NotificationsService** receives the event and:
   - Sends WebSocket notification to provider (instant delivery if online)
   - Checks if provider is offline
   - If offline, sends SMS and Email fallback notifications
3. **Provider** receives notification via:
   - WebSocket toast/browser notification (if online)
   - SMS text message (if offline and phone configured)
   - Email (if offline and email configured)

## Services

### SMS Service (`backend/src/modules/communications/sms.service.ts`)

Sends SMS notifications using Twilio.

**Features:**
- Crisis alerts with emergency contact info
- Safety check requests
- High-risk alerts
- Phone number validation and E.164 formatting
- Graceful fallback if Twilio not configured (simulated mode)

**Methods:**
```typescript
// Send crisis alert
await smsService.sendCrisisAlert(
  '+15551234567',
  'John Doe',
  ['Severe mood decline', 'Multiple high-risk alerts'],
  { name: 'Jane Doe', phone: '+15559876543', relationship: 'Spouse' }
);

// Send safety check request
await smsService.sendSafetyCheckAlert(
  '+15551234567',
  'John Doe',
  'Patient feeling unsafe, requesting immediate contact'
);

// Send risk alert
await smsService.sendRiskAlert(
  '+15551234567',
  'John Doe',
  'Medication Adherence',
  'Patient has missed 3 consecutive medication doses'
);

// Check service status
const status = smsService.getStatus();
// { configured: true, fromNumber: '+15551234567', ready: true }
```

### Email Service (`backend/src/modules/communications/email.service.ts`)

Sends professional HTML emails for crisis notifications.

**Features:**
- Beautiful HTML email templates with gradient headers
- Crisis alerts with emergency contact quick-dial links
- Safety check requests
- Risk alerts with color-coded severity
- Plain text fallback for email clients
- Patient dashboard deep links
- Graceful fallback if SMTP not configured (simulated mode)

**Methods:**
```typescript
// Send crisis alert email
await emailService.sendCrisisAlert(
  'provider@example.com',
  'Dr. Smith',
  'John Doe',
  'patient_cuid123',
  ['Severe mood decline', 'Multiple high-risk alerts'],
  { name: 'Jane Doe', phone: '+15559876543', relationship: 'Spouse' }
);

// Send safety check email
await emailService.sendSafetyCheckAlert(
  'provider@example.com',
  'Dr. Smith',
  'John Doe',
  'patient_cuid123',
  'Patient feeling unsafe'
);

// Send risk alert email
await emailService.sendRiskAlert(
  'provider@example.com',
  'Dr. Smith',
  'John Doe',
  'patient_cuid123',
  'Medication Adherence',
  'Missed 3 consecutive doses',
  0.82 // Risk score
);

// Check service status
const status = emailService.getStatus();
// { configured: true, fromAddress: 'alerts@neurobridge.ai', ready: true }
```

## Installation

### Backend Dependencies

Add to `backend/package.json`:
```json
{
  "dependencies": {
    "twilio": "^4.19.0",
    "nodemailer": "^6.9.7"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.14"
  }
}
```

Install:
```bash
cd backend
npm install twilio nodemailer
npm install --save-dev @types/nodemailer
```

## Configuration

### Environment Variables

Add to `backend/.env`:

```env
# Twilio Configuration (for SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567

# SMTP Configuration (for Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@neurobridge.ai
SMTP_PASS=your_app_password_here
SMTP_FROM_NAME=NeuroBridge AI

# Frontend URL (for dashboard links in emails)
FRONTEND_URL=https://app.neurobridge.ai
```

### Twilio Setup

1. **Create Twilio Account:**
   - Sign up at https://www.twilio.com
   - Get $15 free credit for testing

2. **Get Credentials:**
   - Navigate to Console → Account Info
   - Copy Account SID and Auth Token

3. **Get Phone Number:**
   - Navigate to Phone Numbers → Buy a number
   - Choose a number with SMS capabilities
   - Copy the phone number (E.164 format: +15551234567)

4. **Set Environment Variables:**
   ```env
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1555...
   ```

### Gmail SMTP Setup

1. **Enable 2-Factor Authentication:**
   - Go to Google Account → Security
   - Enable 2-Step Verification

2. **Create App Password:**
   - Go to Google Account → Security → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Name it "NeuroBridge Alerts"
   - Copy the 16-character password

3. **Set Environment Variables:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your.email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # App password from step 2
   SMTP_FROM_NAME=NeuroBridge AI
   ```

### Other SMTP Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key
SMTP_FROM_NAME=NeuroBridge AI
```

**Amazon SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_username
SMTP_PASS=your_ses_password
SMTP_FROM_NAME=NeuroBridge AI
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your_mailgun_password
SMTP_FROM_NAME=NeuroBridge AI
```

## Testing

### Test SMS Sending

```typescript
// In a test file or controller
import { SmsService } from './modules/communications/sms.service';

@Get('/test-sms')
async testSms(@Query('phone') phone: string) {
  const result = await this.smsService.sendCrisisAlert(
    phone,
    'Test Patient',
    ['Test indicator 1', 'Test indicator 2'],
    { name: 'Emergency Contact', phone: '+15559999999', relationship: 'Spouse' }
  );

  return result;
}
```

Test via curl:
```bash
curl "http://localhost:3000/test-sms?phone=+15551234567"
```

### Test Email Sending

```typescript
// In a test file or controller
import { EmailService } from './modules/communications/email.service';

@Get('/test-email')
async testEmail(@Query('email') email: string) {
  const result = await this.emailService.sendCrisisAlert(
    email,
    'Dr. Test',
    'John Doe',
    'test_patient_id',
    ['Severe mood decline', 'Disengagement pattern'],
    { name: 'Jane Doe', phone: '+15559876543', relationship: 'Spouse' }
  );

  return result;
}
```

Test via curl:
```bash
curl "http://localhost:3000/test-email?email=your.email@example.com"
```

### Verify Fallback Logic

1. **Disconnect from WebSocket** (close browser tab with provider dashboard)
2. **Trigger Crisis Alert:**
   ```bash
   # Manually create a crisis for testing
   curl -X POST http://localhost:3000/api/crisis/test-trigger \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"patientId": "patient_123"}'
   ```
3. **Check SMS/Email** - You should receive both within 30 seconds

## Notification Triggers

### Automatic Triggers

| Event Type | Condition | SMS | Email | WebSocket |
|------------|-----------|-----|-------|-----------|
| Crisis Alert | Any crisis detected | ✅ (if offline) | ✅ (if offline) | ✅ Always |
| Safety Check Request | Patient requests check | ✅ (if offline) | ✅ (if offline) | ✅ Always |
| High Risk Alert | Severity = HIGH | ✅ (if offline) | ✅ (if offline) | ✅ Always |
| Medium/Low Risk Alert | Severity < HIGH | ❌ | ❌ | ✅ Always |

### Provider Online/Offline Detection

A provider is considered "offline" when:
- No active WebSocket connections for their providerId
- All browser tabs with provider dashboard are closed
- Network disconnection
- Session timeout

Check provider status:
```typescript
const isOnline = notificationsGateway.isProviderOnline(providerId);
// true = Provider connected to WebSocket
// false = Provider offline, will receive SMS/Email fallback
```

## Message Templates

### SMS Templates

**Crisis Alert:**
```
🚨 CRISIS ALERT

Patient: John Doe

Indicators:
1. Severe mood decline detected for 3+ consecutive days
2. Multiple HIGH severity risk alerts unresolved

Emergency Contact:
Jane Doe (Spouse)
+15559876543

IMMEDIATE ACTION REQUIRED

NeuroBridge AI
```

**Safety Check Request:**
```
🆘 SAFETY CHECK REQUEST

Patient: John Doe
Reason: Patient feeling unsafe, requesting immediate contact

Please respond immediately.

NeuroBridge AI
```

**Risk Alert:**
```
⚠️ HIGH RISK ALERT

Patient: John Doe
Type: Medication Adherence
Patient has missed 3 consecutive medication doses

Review patient dashboard.

NeuroBridge AI
```

### Email Templates

All emails include:
- Professional HTML design with gradient headers
- Color-coded severity (red for crisis, orange for high risk, yellow for safety checks)
- Actionable "View Patient Dashboard" button linking to patient page
- Emergency contact with clickable phone number
- Plain text fallback for email clients without HTML support

Example HTML email structure:
```html
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <!-- Gradient Header -->
  <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
    <h1>🚨 CRISIS ALERT</h1>
  </div>

  <!-- Body -->
  <div>
    <p>Dear Dr. Smith,</p>
    <p>A mental health crisis has been detected for your patient <strong>John Doe</strong>.</p>

    <!-- Crisis Indicators -->
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626;">
      <ul>
        <li>Severe mood decline...</li>
        <li>Multiple high-risk alerts...</li>
      </ul>
    </div>

    <!-- Emergency Contact -->
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b;">
      <strong>Jane Doe</strong> (Spouse)
      <a href="tel:+15559876543">📞 +15559876543</a>
    </div>

    <!-- Action Button -->
    <a href="https://app.neurobridge.ai/provider/patients/123" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
      View Patient Dashboard
    </a>
  </div>
</body>
</html>
```

## Monitoring & Logging

All SMS and Email activities are logged with severity levels:

### Log Examples

```
[NotificationsService] WARN: Crisis detected event received: Patient patient_123
[NotificationsService] WARN: Provider provider_456 is offline - sending SMS/Email fallback
[SmsService] LOG: Crisis SMS sent to provider provider_456: SM9a8b7c6d...
[EmailService] LOG: Crisis email sent to provider provider_456: <message_id@neurobridge.ai>
```

```
[NotificationsService] ERROR: Failed to send crisis SMS: Invalid phone number format
[NotificationsService] LOG: Crisis email sent to provider provider_456: <message_id@neurobridge.ai>
```

### Service Status Endpoint

Check if SMS/Email services are operational:

```typescript
GET /api/notifications/status

Response:
{
  "onlineProviders": 15,
  "connectedProviderIds": ["provider_1", "provider_2", ...],
  "smsServiceReady": true,
  "emailServiceReady": true
}
```

## Cost Estimates

### Twilio SMS Costs

- **Outbound SMS (US):** $0.0075 per message
- **Monthly estimate (100 alerts):** $0.75/month
- **Annual estimate:** ~$9/year

### Email Costs

Most SMTP providers offer free tiers:

- **Gmail:** Free for personal use
- **SendGrid:** 100 emails/day free
- **Mailgun:** 5,000 emails/month free
- **Amazon SES:** $0.10 per 1,000 emails

**Recommended:** Start with Gmail for testing, migrate to SendGrid/Mailgun for production.

## Security & Compliance

### Data Privacy

- Patient names and PHI only sent to authorized providers
- SMS messages use generic "Patient: [Name]" format (no detailed clinical info)
- Emails include emergency contact info only when necessary
- All communication encrypted in transit (TLS)

### HIPAA Compliance

To ensure HIPAA compliance:

1. **Twilio:** Sign Business Associate Agreement (BAA)
   - Navigate to Twilio Console → Compliance
   - Request and sign HIPAA BAA
   - Enable HIPAA-eligible phone numbers

2. **Email:** Use HIPAA-compliant SMTP provider
   - **Paubox:** HIPAA-compliant email API
   - **Amazon SES:** With encryption and BAA
   - **SendGrid:** Enterprise plan with BAA

3. **Encryption:**
   - All SMS/Email sent over TLS
   - Database encryption at rest
   - Environment variables stored securely

### Phone Number Privacy

- Provider phone numbers stored in User table
- Only used for emergency notifications
- Never shared with patients
- Opt-out option available (future feature)

## Troubleshooting

### SMS Not Sending

**Problem:** SMS messages not being received

**Solutions:**
1. Check Twilio credentials:
   ```bash
   echo $TWILIO_ACCOUNT_SID
   echo $TWILIO_AUTH_TOKEN
   echo $TWILIO_PHONE_NUMBER
   ```

2. Verify phone number format:
   - Must be E.164 format: `+15551234567`
   - Use `smsService.formatPhoneNumber(phone)` to convert

3. Check Twilio console for error messages:
   - Navigate to Monitor → Logs → Errors
   - Check for "Invalid phone number" or "Insufficient funds"

4. Verify provider phone number in database:
   ```sql
   SELECT u.phone FROM "User" u
   JOIN "Provider" p ON p."userId" = u.id
   WHERE p.id = 'provider_id';
   ```

### Email Not Sending

**Problem:** Emails not being received

**Solutions:**
1. Check SMTP configuration:
   ```bash
   echo $SMTP_HOST
   echo $SMTP_PORT
   echo $SMTP_USER
   ```

2. Test SMTP connection:
   ```typescript
   const status = emailService.getStatus();
   console.log(status); // Should show configured: true
   ```

3. Check spam folder - Crisis alerts may be flagged

4. Verify app password (Gmail):
   - Must use App Password, not account password
   - Regenerate if needed

5. Check email service logs:
   ```bash
   grep -i "email" logs/application.log
   ```

### Provider Not Receiving Fallback Notifications

**Problem:** Provider is offline but no SMS/Email received

**Solutions:**
1. Verify provider is actually offline:
   ```typescript
   const online = notificationsGateway.isProviderOnline(providerId);
   console.log('Provider online:', online);
   ```

2. Check provider contact info:
   ```sql
   SELECT u.email, u.phone FROM "User" u
   JOIN "Provider" p ON p."userId" = u.id
   WHERE p.id = 'provider_id';
   ```

3. Check application logs for fallback execution:
   ```bash
   grep -i "fallback" logs/application.log
   ```

4. Verify services are operational:
   ```
   GET /api/notifications/status
   ```

## Future Enhancements

### Planned Features

1. **Provider Notification Preferences**
   - Choose which alerts trigger SMS/Email
   - Set quiet hours (no SMS during sleep)
   - Preferred notification method (SMS vs Email vs Both)

2. **Message Delivery Tracking**
   - Track if SMS was delivered
   - Track if email was opened
   - Escalate if not acknowledged within 15 minutes

3. **SMS Reply Handling**
   - Providers can reply to SMS with status updates
   - Auto-create case notes from SMS replies

4. **Multi-Language Support**
   - SMS/Email templates in Spanish, Chinese, etc.
   - Auto-detect provider language preference

5. **Rich Messaging**
   - MMS images (charts, graphs)
   - HTML rich text in SMS (RCS)

6. **Emergency Contact Notifications**
   - Automatically notify emergency contacts if provider doesn't respond
   - Configurable escalation timers

## Support

For issues or questions:
- **Technical Documentation:** https://docs.neurobridge.ai/notifications
- **Twilio Support:** https://www.twilio.com/help
- **SMTP Issues:** Check provider-specific documentation
- **GitHub Issues:** https://github.com/neurobridge/platform/issues
