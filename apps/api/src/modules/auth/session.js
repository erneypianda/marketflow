import { AppError } from "../../app-error.js";
import { createAccessToken } from "./tokens.js";
import {
  rotateRefreshSession,
  revokeRefreshFamily,
} from "./refresh-token.js";

export async function sessionRoutes(app) {
  app.post("/refresh", async function refresh(request, reply) {
    const rotated = await rotateRefreshSession(app.prisma, reply, request, {
      nodeEnv: app.config.NODE_ENV,
    });

    const user = await app.prisma.user.findUnique({
      where: { id: rotated.userId },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        roles: { select: { role: true } },
      },
    });

    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      throw new AppError(401, "UNAUTHENTICATED", "Sesión inválida.");
    }

    const roles = user.roles.map((item) => item.role);
    const accessToken = await createAccessToken({
      userId: user.id,
      roles,
      sid: rotated.familyId,
      jwtSecret: app.config.JWT_SECRET,
    });

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: 900,
    };
  });

  app.post("/logout", async function logout(request, reply) {
    await revokeRefreshFamily(app.prisma, reply, request, {
      nodeEnv: app.config.NODE_ENV,
    });

    return { ok: true };
  });
}
