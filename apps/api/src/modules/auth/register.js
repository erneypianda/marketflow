import { z } from "zod";
import argon2 from "argon2";
import { AppError } from "../../app-error.js";

const registerBodySchema = z.object({
  email: z.string().trim().email("El email no es válido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
  displayName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre es demasiado largo"),
});

export async function registerRoutes(app) {
  app.post("/register", async function register(request, reply) {
    const parsed = registerBodySchema.safeParse(request.body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Datos inválidos";
      throw new AppError(422, "VALIDATION_ERROR", message);
    }

    const email = parsed.data.email.toLowerCase();
    const { password, displayName } = parsed.data;

    const existing = await app.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new AppError(
        409,
        "EMAIL_TAKEN",
        "Ya existe una cuenta con ese email.",
      );
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const user = await app.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        roles: {
          create: [{ role: "CUSTOMER" }],
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        roles: {
          select: { role: true },
        },
      },
    });

    return reply.status(201).send({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        roles: user.roles.map((item) => item.role),
      },
    });
  });
}
