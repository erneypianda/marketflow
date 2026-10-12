import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

export function loadEnv(source = process.env) {
  const parsed = envSchema.safeParse({
    NODE_ENV: source.NODE_ENV,
    PORT: source.PORT,
  });

  if (!parsed.success) {
    throw new Error(
      "Configuración inválida: NODE_ENV es obligatorio y debe ser development, test o production.",
    );
  }

  return parsed.data;
}
