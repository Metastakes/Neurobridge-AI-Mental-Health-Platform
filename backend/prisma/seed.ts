import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create achievements
  const achievements = await Promise.all([
    prisma.achievement.upsert({
      where: { key: 'first_session' },
      update: {},
      create: {
        key: 'first_session',
        name: 'First Steps',
        description: 'Completed your first therapy session',
        icon: '🎯',
        points: 50,
      },
    }),
    prisma.achievement.upsert({
      where: { key: 'safety_expert' },
      update: {},
      create: {
        key: 'safety_expert',
        name: 'Safety Expert',
        description: 'Completed 10 safety check-ins',
        icon: '🛡️',
        points: 100,
      },
    }),
    prisma.achievement.upsert({
      where: { key: 'streak_7' },
      update: {},
      create: {
        key: 'streak_7',
        name: '7-Day Streak',
        description: 'Maintained engagement for 7 days',
        icon: '🔥',
        points: 150,
      },
    }),
  ]);

  console.log('✅ Created achievements:', achievements.length);

  // Create users
  const hashedPassword = await bcrypt.hash('password', 10);

  // Mentor
  const mentorUser = await prisma.user.upsert({
    where: { email: 'mentor@neuro.io' },
    update: {},
    create: {
      email: 'mentor@neuro.io',
      password: hashedPassword,
      role: 'MENTOR',
      firstName: 'Dr. Ben',
      lastName: 'Carter',
      phone: '555-0104',
    },
  });

  const mentor = await prisma.mentor.upsert({
    where: { userId: mentorUser.id },
    update: {},
    create: {
      userId: mentorUser.id,
      npiNumber: '1234567893',
      licenseNumber: 'MED-93456',
    },
  });

  console.log('✅ Created mentor:', mentor.id);

  // Provider
  const providerUser = await prisma.user.upsert({
    where: { email: 'provider@neuro.io' },
    update: {},
    create: {
      email: 'provider@neuro.io',
      password: hashedPassword,
      role: 'PROVIDER',
      firstName: 'Dr. Evelyn',
      lastName: 'Reed',
      phone: '555-0101',
    },
  });

  const provider = await prisma.provider.upsert({
    where: { userId: providerUser.id },
    update: {},
    create: {
      userId: providerUser.id,
      mentorId: mentor.id,
      npiNumber: '1234567890',
      licenseNumber: 'MED-12345',
      licenseState: 'CA',
      deaNumber: 'DR1234567',
    },
  });

  console.log('✅ Created provider:', provider.id);

  // Patient 1: Alex Johnson
  const patient1User = await prisma.user.upsert({
    where: { email: 'patient@neuro.io' },
    update: {},
    create: {
      email: 'patient@neuro.io',
      password: hashedPassword,
      role: 'PATIENT',
      firstName: 'Alex',
      lastName: 'Johnson',
      phone: '555-0102',
    },
  });

  const patient1 = await prisma.patient.upsert({
    where: { userId: patient1User.id },
    update: {},
    create: {
      userId: patient1User.id,
      dateOfBirth: new Date('1990-05-15'),
      sex: 'Male',
      address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      emergencyContact: 'Jane Johnson',
      emergencyPhone: '555-0199',
      pharmacyName: 'CVS Pharmacy',
      pharmacyPhone: '555-0200',
      pharmacyAddress: '456 Market St, SF, CA 94102',
      height: 70, // inches
      weight: 175, // pounds
      alertStatus: 'STABLE',
      onboardingComplete: true,
      providerId: provider.id,
    },
  });

  console.log('✅ Created patient 1:', patient1.id);

  // Add diagnoses for patient 1
  await prisma.diagnosis.create({
    data: {
      patientId: patient1.id,
      icdCode: 'F32.9',
      description: 'Major Depressive Disorder',
      isPrimary: true,
    },
  });

  await prisma.diagnosis.create({
    data: {
      patientId: patient1.id,
      icdCode: 'F41.1',
      description: 'Generalized Anxiety Disorder',
      isPrimary: false,
    },
  });

  // Add medications for patient 1
  await prisma.medication.createMany({
    data: [
      {
        patientId: patient1.id,
        name: 'Sertraline',
        dosage: '100mg',
        frequency: 'Once daily',
        category: 'SSRI',
        status: 'ACTIVE',
        prescriberId: provider.id,
      },
      {
        patientId: patient1.id,
        name: 'Buspirone',
        dosage: '15mg',
        frequency: 'Twice daily',
        category: 'Anxiolytic',
        status: 'ACTIVE',
        prescriberId: provider.id,
      },
    ],
  });

  // Add allergy for patient 1
  await prisma.allergy.create({
    data: {
      patientId: patient1.id,
      allergen: 'Penicillin',
      reaction: 'Hives',
      severity: 7,
    },
  });

  // Create a gamification event
  await prisma.gamificationEvent.create({
    data: {
      patientId: patient1.id,
      eventType: 'SESSION_COMPLETED',
      points: 50,
      metadata: {
        sessionDate: new Date().toISOString(),
      },
    },
  });

  // Unlock an achievement
  await prisma.patientAchievement.create({
    data: {
      patientId: patient1.id,
      achievementId: achievements[0].id,
    },
  });

  // Create an encounter
  const encounter = await prisma.encounter.create({
    data: {
      patientId: patient1.id,
      providerId: provider.id,
      scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
      status: 'SCHEDULED',
      durationMinutes: 50,
    },
  });

  console.log('✅ Created encounter:', encounter.id);

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📧 Demo Login Credentials:');
  console.log('   Patient: patient@neuro.io / password');
  console.log('   Provider: provider@neuro.io / password');
  console.log('   Mentor: mentor@neuro.io / password');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
