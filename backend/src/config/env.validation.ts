import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, IsEnum, IsOptional, validateSync, IsBoolean } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  // Database
  @IsString()
  DATABASE_URL: string;

  // JWT
  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  // Node Environment
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  // Server
  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:5173';

  // Google Gemini AI
  @IsString()
  @IsOptional()
  GEMINI_API_KEY: string;

  // Google Cloud
  @IsString()
  @IsOptional()
  GOOGLE_CLOUD_PROJECT_ID: string;

  @IsString()
  @IsOptional()
  GOOGLE_APPLICATION_CREDENTIALS: string;

  // Google OAuth
  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET: string;

  @IsString()
  @IsOptional()
  GOOGLE_CALLBACK_URL: string;

  // Stripe
  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET: string;

  @IsString()
  @IsOptional()
  STRIPE_PUBLISHABLE_KEY: string;

  // HIPAA Compliance
  @IsNumber()
  @IsOptional()
  AUDIT_LOG_RETENTION_DAYS: number = 2555; // 7 years

  @IsBoolean()
  @IsOptional()
  ENABLE_PHI_ENCRYPTION: boolean = true;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((error) => {
      return Object.values(error.constraints || {}).join(', ');
    }).join('\n');

    throw new Error(`❌ Environment validation failed:\n${errorMessages}`);
  }

  // Warning for optional but recommended variables
  const warnings: string[] = [];

  if (!validatedConfig.GEMINI_API_KEY) {
    warnings.push('⚠️  GEMINI_API_KEY not set - AI features will be disabled');
  }

  if (!validatedConfig.GOOGLE_CLOUD_PROJECT_ID) {
    warnings.push('⚠️  GOOGLE_CLOUD_PROJECT_ID not set - Google Calendar integration disabled');
  }

  if (!validatedConfig.STRIPE_SECRET_KEY) {
    warnings.push('⚠️  STRIPE_SECRET_KEY not set - Payment features disabled');
  }

  if (warnings.length > 0) {
    console.warn('\n' + warnings.join('\n') + '\n');
  }

  return validatedConfig;
}
