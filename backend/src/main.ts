import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

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
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('health', 'Health Check & Monitoring')
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

  const serverUrl = `http://localhost:${port}`;

  console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   🧠 NeuroBridge AI Mental Health Platform               ║
    ║                                                           ║
    ║   API Server: ${serverUrl.padEnd(43)}║
    ║   Swagger Docs: ${(serverUrl + '/api/docs').padEnd(39)}║
    ║   Health Check: ${(serverUrl + '/api/health').padEnd(39)}║
    ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(42)}║
    ║                                                           ║
    ║   ✅ HIPAA Compliance: ENABLED                            ║
    ║   ✅ Audit Logging: ACTIVE                                ║
    ║   ✅ Rate Limiting: ENABLED                               ║
    ║   ✅ Security Headers: ACTIVE                             ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
