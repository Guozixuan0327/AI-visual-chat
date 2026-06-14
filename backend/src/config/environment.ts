import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DASHSCOPE_API_KEY: z.string().min(1, 'DashScope API Key is required'),
  QWEN_VL_MODEL: z.string().default('qwen-vl-max'),
  QWEN_VL_API_ENDPOINT: z.string().url().default('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('30'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const config = parsed.data;
