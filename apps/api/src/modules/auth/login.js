import { z } from "zod";
import argon2 from "argon2";
import { AppError } from "../../app-error.js";
import { createAccessToken } from "./tokens.js";
import { issueRefreshSession } from "./refresh-token.js";

const loginBodySchema = z.object({
  email: z.string().trim().email("El email no es válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export async function loginRoutes(app) {
  app.post("/login", async function login(request, reply) {
    const parsed = loginBodySchema.safeParse(request.body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Datos inválidos";
      throw new AppError(422, "VALIDATION_ERROR", message);
    }

    const email = parsed.data.email.toLowerCase();
    const { password } = parsed.data;

    const user = await app.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        passwordHash: true,
        deletedAt: true,
        roles: {
          select: { role: true },
        },
      },
    });

    const invalidCredentials = new AppError(
      401,
      "UNAUTHENTICATED",
      "Email o contraseña incorrectos.",
    );

    if (!user || user.deletedAt) {
      throw invalidCredentials;
    }

    const passwordOk = await argon2.verify(user.passwordHash, password);

    if (!passwordOk) {
      throw invalidCredentials;
    }

    if (user.status !== "ACTIVE") {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Esta cuenta no puede iniciar sesión.",
      );
    }

    const roles = user.roles.map((item) => item.role);

    const { familyId } = await issueRefreshSession(app.prisma, reply, {
      userId: user.id,
      nodeEnv: app.config.NODE_ENV,
    });

    const accessToken = await createAccessToken({
      userId: user.id,
      roles,
      sid: familyId,
      jwtSecret: app.config.JWT_SECRET,
    });

    return reply.send({
      accessToken,
      tokenType: "Bearer",
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        roles,
      },
    });
  });
}
