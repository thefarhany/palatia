import "dotenv/config";

// Fail fast at boot — a missing secret must crash the process, not sign "undefined" tokens.
const required = ["DATABASE_URL", "JWT_SECRET"] as const;

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env: ${key}`);
}

export default {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  PORT: Number(process.env.PORT ?? 4000),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
  // Origin of the Next.js web app — used to build QR menu URLs.
  PUBLIC_URL: process.env.PUBLIC_URL ?? "http://localhost:3000",
  TAX_PERCENT: Number(process.env.TAX_PERCENT ?? 10),
  SERVICE_PERCENT: Number(process.env.SERVICE_PERCENT ?? 5),
} as const;