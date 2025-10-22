# Option B: Growth Focus - Implementation Plan

**Timeline:** 2-3 weeks
**Goal:** Build viral growth engine through referrals, reviews, and social sharing

---

## 🎯 Features to Build

### 1. Complete Referral System
- ✅ Patient referral codes & tracking
- ✅ Provider referral codes & tracking
- ✅ Referral rewards & bonuses
- ✅ Referral dashboard & analytics

### 2. Social Sharing Cards
- ✅ Achievement card generator
- ✅ Milestone celebration templates
- ✅ Instagram/Facebook/LinkedIn formats
- ✅ Privacy-safe sharing (no PHI)

### 3. Review System with Google Integration
- ✅ Post-session review prompts
- ✅ Internal review system
- ✅ Google Reviews integration
- ✅ Review rewards (50-100 points)

### 4. Provider Marketing Materials
- ✅ Profile page generator
- ✅ Social media templates
- ✅ Shareable credentials card
- ✅ Patient testimonial display

---

## 📊 Database Schema

### New Tables

#### 1. Referral Table
```prisma
model Referral {
  id              String    @id @default(cuid())

  // Referrer (who sent the referral)
  referrerType    ReferrerType  // PATIENT or PROVIDER
  patientId       String?
  patient         Patient?  @relation("ReferrerPatient", fields: [patientId], references: [id])
  providerId      String?
  provider        Provider? @relation("ReferrerProvider", fields: [providerId], references: [id])

  // Referee (who was referred)
  refereeType     ReferrerType
  refereePatientId String?
  refereePatient  Patient?  @relation("RefereePatient", fields: [refereePatientId], references: [id])
  refereeProviderId String?
  refereeProvider Provider? @relation("RefereeProvider", fields: [refereeProviderId], references: [id])

  // Tracking
  referralCode    String    @unique
  status          ReferralStatus // PENDING, SIGNED_UP, ONBOARDED, FIRST_SESSION, ACTIVE

  // Rewards
  rewardType      String?   // POINTS, MONEY, FREE_SESSION
  rewardAmount    Float?
  rewardClaimed   Boolean   @default(false)
  rewardClaimedAt DateTime?

  // Metadata
  signupDate      DateTime?
  firstSessionDate DateTime?
  metadata        Json?     // Campaign tracking, UTM params, etc.

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([referralCode])
  @@index([patientId])
  @@index([providerId])
  @@index([status])
}

enum ReferrerType {
  PATIENT
  PROVIDER
}

enum ReferralStatus {
  PENDING        // Referral code created
  SIGNED_UP      // Referee created account
  ONBOARDED      // Referee completed onboarding
  FIRST_SESSION  // Referee completed first session
  ACTIVE         // Referee stayed 3+ months
}
```

#### 2. Review Table (Enhanced)
```prisma
model Review {
  id              String    @id @default(cuid())

  // Participants
  patientId       String
  patient         Patient   @relation(fields: [patientId], references: [id], onDelete: Cascade)
  providerId      String
  provider        Provider  @relation(fields: [providerId], references: [id])
  sessionId       String?
  session         Encounter? @relation(fields: [sessionId], references: [id])

  // Review content
  rating          Int       // 1-5 stars
  feedback        String?
  quickTags       String[]  // ["Helpful", "Professional", "Good Listener"]

  // Review type
  isInternal      Boolean   @default(true)
  isPublic        Boolean   @default(false)
  isGoogleReview  Boolean   @default(false)
  googleReviewUrl String?

  // Rewards
  pointsAwarded   Int       @default(0)
  bonusAwarded    Boolean   @default(false)

  // Moderation
  approved        Boolean   @default(false)
  moderatedBy     String?
  moderatedAt     DateTime?
  flagged         Boolean   @default(false)
  flagReason      String?

  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([patientId])
  @@index([providerId])
  @@index([rating])
  @@index([isPublic])
  @@index([approved])
}
```

#### 3. SocialShare Table
```prisma
model SocialShare {
  id              String    @id @default(cuid())

  // User
  patientId       String?
  patient         Patient?  @relation(fields: [patientId], references: [id])
  providerId      String?
  provider        Provider? @relation(fields: [providerId], references: [id])

  // Share content
  shareType       ShareType // ACHIEVEMENT, MILESTONE, REVIEW, PROFILE
  platform        Platform  // INSTAGRAM, FACEBOOK, LINKEDIN, TWITTER

  // Content details
  title           String
  description     String?
  imageUrl        String?
  shareUrl        String

  // Tracking
  clicks          Int       @default(0)
  signups         Int       @default(0)
  pointsEarned    Int       @default(0)

  // Metadata
  metadata        Json?     // Achievement details, milestone info, etc.

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([patientId])
  @@index([providerId])
  @@index([shareType])
  @@index([platform])
}

enum ShareType {
  ACHIEVEMENT
  MILESTONE
  REVIEW
  PROFILE
  REFERRAL
}

enum Platform {
  INSTAGRAM
  FACEBOOK
  LINKEDIN
  TWITTER
}
```

#### 4. ReferralReward Table
```prisma
model ReferralReward {
  id              String    @id @default(cuid())

  name            String    // "3 Referrals = Free Session"
  description     String

  // Conditions
  referralCount   Int       // How many referrals needed
  referralStatus  ReferralStatus // What status they must reach

  // Reward
  rewardType      String    // POINTS, FREE_SESSION, PREMIUM_MONTH, CASH
  rewardAmount    Float     // Points or dollar amount

  // Settings
  isActive        Boolean   @default(true)
  applicableTo    ReferrerType[] // [PATIENT, PROVIDER]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Updated Tables

#### Patient Table (Add referral fields)
```prisma
model Patient {
  // ... existing fields

  // Referral tracking
  referralCode      String?   @unique
  referredBy        String?   // Referral code that brought them in
  referralSource    String?   // Where they came from

  // Relationships
  referralsGiven    Referral[] @relation("ReferrerPatient")
  referralsReceived Referral[] @relation("RefereePatient")
  socialShares      SocialShare[]
  reviews           Review[]
}
```

#### Provider Table (Add referral fields)
```prisma
model Provider {
  // ... existing fields

  // Referral tracking
  referralCode      String?   @unique
  referredBy        String?
  referralBonus     Float     @default(0) // Total earned from referrals

  // Marketing
  profileUrl        String?   @unique // neurobridge.com/dr-smith
  bio               String?
  specialties       String[]
  credentials       String[]

  // Relationships
  referralsGiven    Referral[] @relation("ReferrerProvider")
  referralsReceived Referral[] @relation("RefereeProvider")
  socialShares      SocialShare[]
  reviews           Review[]
}
```

---

## 🔧 Backend APIs

### Referral APIs

#### Patient Referrals
```typescript
// GET /api/patients/:id/referrals
// Get patient's referral stats and history
{
  referralCode: "SARAH2024",
  totalReferrals: 7,
  pendingReferrals: 2,
  completedReferrals: 5,
  totalPointsEarned: 700,
  nextReward: {
    name: "3 referrals = Free Session",
    progress: 7,
    target: 10
  },
  referrals: [
    {
      id: "ref_123",
      refereeName: "John D.",
      status: "FIRST_SESSION",
      signupDate: "2025-01-15",
      pointsEarned: 150,
      rewardClaimed: true
    }
  ]
}

// POST /api/referrals/track
// Track referral signup
{
  referralCode: "SARAH2024",
  email: "newuser@example.com",
  userType: "PATIENT"
}

// POST /api/referrals/claim-reward
// Claim referral reward
{
  referralId: "ref_123"
}
```

#### Provider Referrals
```typescript
// GET /api/providers/:id/referrals
{
  referralCode: "DRSMITH2024",
  profileUrl: "neurobridge.com/dr-smith",
  totalReferrals: 45,
  totalBonusEarned: 6750,
  pendingBonus: 250,
  referrals: [...]
}

// POST /api/providers/:id/generate-marketing
// Generate marketing materials
{
  type: "LINKEDIN_POST" | "INSTAGRAM_STORY" | "PROFILE_CARD",
  includeStats: true
}
```

### Review APIs

```typescript
// POST /api/reviews
// Submit review after session
{
  sessionId: "session_123",
  rating: 5,
  feedback: "Dr. Smith was incredibly helpful!",
  quickTags: ["Helpful", "Professional"],
  shareOnGoogle: true
}

// GET /api/reviews/prompt/:sessionId
// Check if review prompt should be shown
{
  shouldPrompt: true,
  session: {...},
  provider: {...}
}

// POST /api/reviews/:id/submit-to-google
// Submit review to Google
{
  reviewId: "review_123",
  googleReviewText: "Great therapist!"
}

// GET /api/providers/:id/reviews
// Get provider reviews
{
  averageRating: 4.9,
  totalReviews: 45,
  reviews: [...]
}
```

### Social Share APIs

```typescript
// POST /api/social-shares/generate
// Generate shareable card
{
  shareType: "ACHIEVEMENT",
  achievementId: "30-day-streak",
  platform: "INSTAGRAM"
}
// Returns: { imageUrl, shareText, shareUrl }

// POST /api/social-shares/track
// Track when share is posted
{
  shareId: "share_123",
  platform: "INSTAGRAM"
}

// GET /api/social-shares/:id/analytics
// Get share performance
{
  clicks: 45,
  signups: 3,
  pointsEarned: 25
}
```

---

## 🎨 Frontend Components

### 1. Patient Referral Dashboard
```
components/patient/ReferralDashboard.tsx
┌─────────────────────────────────────────────┐
│  🎁 Share & Get Rewards                     │
├─────────────────────────────────────────────┤
│  Your Code: SARAH2024                       │
│  [Copy] [Share]                             │
│                                             │
│  Referrals: 7                               │
│  Points Earned: 700 💎                      │
│                                             │
│  Progress to Free Session:                  │
│  ▓▓▓▓▓▓▓░░░ 7/10                           │
│                                             │
│  Recent:                                    │
│  ✅ John D. - Started (100 pts)            │
│  ⏳ Mike R. - Signed up (pending)          │
│                                             │
│  [View All] [Rewards]                      │
└─────────────────────────────────────────────┘
```

### 2. Review Prompt Modal
```
components/reviews/ReviewPromptModal.tsx
┌─────────────────────────────────────────────┐
│  ✅ Session Complete!                       │
├─────────────────────────────────────────────┤
│  How was your session with Dr. Smith?      │
│                                             │
│  ⭐⭐⭐⭐⭐                                    │
│                                             │
│  Quick Feedback:                            │
│  ☑ Helpful    ☑ Professional               │
│  ☑ Listened   □ Would recommend            │
│                                             │
│  [Skip] [Submit] (+50 pts)                 │
└─────────────────────────────────────────────┘
```

### 3. Google Review Upsell
```
components/reviews/GoogleReviewPrompt.tsx
┌─────────────────────────────────────────────┐
│  🌟 Thanks for the 5-star review!          │
├─────────────────────────────────────────────┤
│  Share on Google Reviews?                   │
│                                             │
│  ✅ Help others find great care            │
│  ✅ Support Dr. Smith                       │
│  ✅ Earn 100 bonus points!                 │
│                                             │
│  [Review on Google] [Later]                │
└─────────────────────────────────────────────┘
```

### 4. Social Share Generator
```
components/social/ShareCardGenerator.tsx
┌─────────────────────────────────────────────┐
│  📸 Share Your Success                      │
├─────────────────────────────────────────────┤
│  [Preview Card]                             │
│  ┌───────────────────┐                      │
│  │  🌟 30-Day Streak!│                      │
│  │  I'm prioritizing │                      │
│  │  my mental health │                      │
│  │  @NeuroBridge     │                      │
│  └───────────────────┘                      │
│                                             │
│  Share to:                                  │
│  [Instagram] [Facebook] [LinkedIn]         │
│                                             │
│  🎁 Earn 25 points!                        │
└─────────────────────────────────────────────┘
```

### 5. Provider Referral Hub
```
components/provider/ReferralHub.tsx
┌─────────────────────────────────────────────┐
│  💼 Grow Your Practice                      │
├─────────────────────────────────────────────┤
│  neurobridge.com/dr-smith                   │
│  [Copy Link] [Share to LinkedIn]           │
│                                             │
│  📊 Stats:                                  │
│  • 45 patients referred                     │
│  • $6,750 earned this year                 │
│  • 4.9 ⭐ rating                            │
│                                             │
│  🎯 Marketing:                              │
│  [LinkedIn Post] [Profile Card]            │
│                                             │
│  Recent Referrals:                          │
│  💰 Sarah K. - First session ($50)         │
│  ⏳ Mike R. - Signed up ($25)              │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Implementation Steps

### Week 1: Database & Backend

**Day 1-2: Database Schema**
- ✅ Create Prisma models
- ✅ Write migration for Referral table
- ✅ Write migration for Review table
- ✅ Write migration for SocialShare table
- ✅ Update Patient/Provider tables
- ✅ Run migrations

**Day 3-4: Referral Backend**
- ✅ Create ReferralsModule
- ✅ ReferralsService (CRUD, tracking, rewards)
- ✅ ReferralsController (endpoints)
- ✅ Generate unique referral codes
- ✅ Track referral status changes
- ✅ Calculate and award rewards

**Day 5: Review Backend**
- ✅ Create ReviewsModule
- ✅ ReviewsService (CRUD, moderation)
- ✅ ReviewsController
- ✅ Post-session review logic
- ✅ Google Reviews integration (API setup)

### Week 2: Frontend Core

**Day 1-2: Referral UI (Patient)**
- ✅ ReferralDashboard component
- ✅ ReferralCodeDisplay component
- ✅ ReferralHistory component
- ✅ RewardProgress component
- ✅ Share button with copy/social

**Day 3: Review UI**
- ✅ ReviewPromptModal (post-session)
- ✅ QuickFeedback component
- ✅ GoogleReviewPrompt component
- ✅ ReviewHistory component

**Day 4: Provider Referral UI**
- ✅ ProviderReferralHub component
- ✅ ReferralStats dashboard
- ✅ MarketingMaterials generator
- ✅ ProfileShareButtons

**Day 5: Social Sharing**
- ✅ ShareCardGenerator component
- ✅ Card templates (achievement, milestone)
- ✅ Platform-specific formatting
- ✅ Share tracking

### Week 3: Polish & Integration

**Day 1-2: Social Card Generator**
- ✅ HTML Canvas rendering
- ✅ Export to image
- ✅ Template designs
- ✅ Privacy filters (no PHI)

**Day 3: Google Reviews Integration**
- ✅ Google Places API setup
- ✅ Deep link to review page
- ✅ Callback tracking
- ✅ Reward automation

**Day 4: Testing**
- ✅ Unit tests for referral logic
- ✅ E2E test: Patient refers friend
- ✅ E2E test: Review → Google flow
- ✅ E2E test: Social share generation

**Day 5: Analytics & Reporting**
- ✅ Referral analytics dashboard
- ✅ Review metrics tracking
- ✅ Social share performance
- ✅ Admin overview

---

## 📊 Success Metrics

### Track These KPIs:

**Referrals:**
- Referral signup rate (% of referrals who sign up)
- Referral conversion rate (% who become active)
- Average referrals per patient
- Referral bonus payout

**Reviews:**
- Review submission rate (target: 60%)
- Google review rate (target: 30% of 5-star)
- Average rating (target: 4.5+)
- Review response time

**Social Sharing:**
- Share rate (% of patients who share)
- Platform distribution
- Click-through rate
- Signups from social

---

## 🎯 Rewards Configuration

### Patient Referral Rewards
```typescript
const PATIENT_REFERRAL_REWARDS = {
  SIGNUP: {
    points: 50,
    description: "Friend signs up"
  },
  ONBOARDED: {
    points: 50,
    description: "Friend completes onboarding"
  },
  FIRST_SESSION: {
    points: 100,
    description: "Friend completes first session"
  },
  MILESTONES: [
    { count: 3, reward: "FREE_SESSION", value: 1 },
    { count: 10, reward: "PREMIUM_MONTH", value: 1 },
    { count: 25, reward: "VIP_STATUS" }
  ]
}
```

### Provider Referral Rewards
```typescript
const PROVIDER_REFERRAL_REWARDS = {
  SIGNUP: {
    amount: 25,
    description: "Patient signs up with your link"
  },
  FIRST_SESSION: {
    amount: 50,
    description: "Patient completes first session"
  },
  THREE_MONTH: {
    amount: 100,
    description: "Patient stays 3+ months"
  }
}
```

### Review Rewards
```typescript
const REVIEW_REWARDS = {
  INTERNAL_REVIEW: {
    points: 50
  },
  GOOGLE_REVIEW: {
    points: 100,
    bonusMultiplier: 2 // 200 pts for 5-star Google review
  }
}
```

---

## 🔐 Privacy & Compliance

### HIPAA Considerations

**Safe to Share:**
- ✅ Generic achievements (streaks, point totals)
- ✅ Non-clinical badges
- ✅ Wellness quotes
- ✅ Provider credentials
- ✅ Anonymized testimonials (with consent)

**NEVER Share:**
- ❌ Diagnoses
- ❌ Medications
- ❌ Treatment details
- ❌ Session notes
- ❌ Provider-patient relationship

### Implementation:
```typescript
// Privacy filter for shares
function sanitizeShareContent(content) {
  return {
    ...content,
    // Remove PHI
    diagnosis: undefined,
    medications: undefined,
    notes: undefined,
    // Anonymize if needed
    patientName: content.allowNameShare ? content.patientName : "Anonymous"
  }
}
```

---

## 📱 Google Reviews Integration

### Setup Steps

1. **Get Google Places API Key**
   ```bash
   # In Google Cloud Console:
   # 1. Enable Places API
   # 2. Create API key
   # 3. Add to .env
   ```

2. **Find Place ID**
   ```typescript
   // Use Places API to find your business
   const placeId = "ChIJ..."; // Your NeuroBridge place ID
   ```

3. **Generate Review Link**
   ```typescript
   const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
   ```

4. **Track Completion**
   ```typescript
   // Use UTM params or callback URL
   const trackingUrl = `${googleReviewUrl}&utm_source=neurobridge&utm_campaign=review_${reviewId}`;
   ```

---

## 🚀 Launch Plan

### Beta Testing (1 week)
- Select 10 engaged patients
- Select 3 providers
- Enable features for them
- Gather feedback
- Iterate

### Soft Launch (1 week)
- Enable for 25% of users
- Monitor metrics
- Fix bugs
- Optimize flows

### Full Launch
- Enable for 100% of users
- Marketing campaign
- Email announcement
- In-app notifications

---

## 📈 Expected Outcomes (3 months)

**Referrals:**
- 30% of patients create referral code
- 15% successfully refer 1+ friend
- 10% monthly growth from referrals

**Reviews:**
- 60% review submission rate
- 4.6 average rating
- 100+ Google reviews

**Social Sharing:**
- 20% share rate
- 5,000+ social impressions
- 50+ signups from social

**Overall:**
- 15% monthly growth
- 25% increase in engagement
- 30% increase in provider satisfaction

---

**Ready to start building!** 🚀

Which component should we tackle first?
1. Database schema & migrations
2. Referral backend APIs
3. Review system
4. Social sharing

Or should I build them all in sequence?
