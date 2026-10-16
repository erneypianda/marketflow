import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
});

export function loadEnv(source = process.env) {
  const parsed = envSchema.safeParse({
    NODE_ENV: source.NODE_ENV,
    PORT: source.PORT,
    DATABASE_URL: source.DATABASE_URL,
    JWT_SECRET: source.JWT_SECRET,
  });

  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(
      "Configuración inválida: revisa NODE_ENV, PORT, DATABASE_URL y JWT_SECRET. " +
        detail,
    );
  }

  return parsed.data;
}
