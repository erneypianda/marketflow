import { AppError } from "../../app-error.js";
import { requireAuth } from "../auth/require-auth.js";

export async function meRoutes(app) {
  app.get(
    "/me",
    { preHandler: [requireAuth] },
    async function getMe(request) {
      const user = await app.prisma.user.findUnique({
        where: { id: request.auth.userId },
        select: {
          id: true,
          email: true,
          displayName: true,
          status: true,
          deletedAt: true,
          roles: {
            select: { role: true },
          },
        },
      });

      if (!user || user.deletedAt) {
        throw new AppError(401, "UNAUTHENTICATED", "Sesión inválida.");
      }

      if (user.status !== "ACTIVE") {
        throw new AppError(
          403,
          "FORBIDDEN",
          "Esta cuenta no puede usar la API.",
        );
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          status: user.status,
          roles: user.roles.map((item) => item.role),
        },
      };
    },
  );
}
