import { jwtVerify } from "jose";
import { AppError } from "../../app-error.js";

/**
 * preHandler: exige Authorization: Bearer <accessToken>.
 * Si el pase es válido, deja request.auth = { userId, roles, sid }.
 */
export async function requireAuth(request) {
  const header = request.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "Necesitas iniciar sesión.",
    );
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "Necesitas iniciar sesión.",
    );
  }

  try {
    const secret = new TextEncoder().encode(request.server.config.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (!payload.sub || !Array.isArray(payload.roles)) {
      throw new AppError(401, "UNAUTHENTICATED", "Sesión inválida.");
    }

    request.auth = {
      userId: payload.sub,
      roles: payload.roles,
      sid: payload.sid,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(401, "UNAUTHENTICATED", "Sesión inválida o caducada.");
  }
}
