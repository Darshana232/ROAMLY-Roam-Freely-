import { z } from 'zod';

// Validate configuration once at startup so a missing secret fails loudly
// instead of surfacing later as a confusing runtime error.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  // Proxies in front of the API. Vercel's rewrite plus Render's load balancer = 2.
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(1),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';

if (isProd && !env.MONGO_URI) {
  console.error('MONGO_URI is required in production');
  process.exit(1);
}
