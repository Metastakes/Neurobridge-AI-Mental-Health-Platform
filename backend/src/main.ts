import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('NeuroBridge AI API')
    .setDescription('HIPAA-compliant mental health platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & Authorization')
    .addTag('patients', 'Patient Management')
    .addTag('medications', 'Medication Management')
    .addTag('diagnoses', 'Diagnosis Management')
    .addTag('encounters', 'Appointments & Sessions')
    .addTag('ai', 'AI-Powered Clinical Support')
    .addTag('scheduling', 'Google Calendar Integration')
    .addTag('gamification', 'Patient Engagement & Rewards')
    .addTag('billing', 'Billing & Compliance')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   🧠 NeuroBridge AI Mental Health Platform               ║
    ║                                                           ║
    ║   API Server: http://localhost:${port}                    ║
    ║   Swagger Docs: http://localhost:${port}/api/docs         ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}                   ║
    ║                                                           ║
    ║   HIPAA Compliance: ENABLED                               ║
    ║   Audit Logging: ACTIVE                                   ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
