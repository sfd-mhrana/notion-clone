import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  FRONTEND_URL: Joi.string().required(),

  // Database
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_URL: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Google OAuth
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().required(),

  // GitHub OAuth (optional)
  GITHUB_CLIENT_ID: Joi.string().optional(),
  GITHUB_CLIENT_SECRET: Joi.string().optional(),
  GITHUB_CALLBACK_URL: Joi.string().optional(),

  // AWS S3 / MinIO
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  S3_ENDPOINT: Joi.string().optional(),

  // AI (Claude API) - optional
  ANTHROPIC_API_KEY: Joi.string().optional(),
});
