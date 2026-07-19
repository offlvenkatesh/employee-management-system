import dotenv from "dotenv";

dotenv.config();

function stringEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }
  return value;
}

function booleanEnv(name: string, fallback = false): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: numberEnv("PORT", 4000),
  mongoUri: stringEnv("MONGO_URI", "mongodb://localhost:27017/ems"),
  jwtSecret: stringEnv("JWT_SECRET", "dev-only-change-this-ems-secret"),
  jwtExpiresIn: stringEnv("JWT_EXPIRES_IN", "8h"),
  clientOrigin: stringEnv("CLIENT_ORIGIN", "http://localhost:5173"),
  defaultEmployeePassword: stringEnv("DEFAULT_EMPLOYEE_PASSWORD", "Welcome@123"),
  seedOnStart: booleanEnv("SEED_ON_START", false),
  demoMode: booleanEnv("DEMO_MODE", false)
} as const;

export const isProduction = config.nodeEnv === "production";
