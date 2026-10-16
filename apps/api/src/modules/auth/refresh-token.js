import { createHash, randomBytes, randomUUID } from "node:crypto";
import { AppError } from "../../app-error.js";

const REFRESH_COOKIE = "refreshToken";
const REFRESH_DAYS = 7;
const CSRF_HEADER = "x-marketflow-csrf";

function hashToken(rawToken) {
  return createHash("sha256").update(rawToken).digest("hex");
}

function cookieOptions(nodeEnv) {
  return {
    path: "/api/v1/auth",
    httpOnly: true,
    sameSite: "strict",
    secure: nodeEnv === "production",
    maxAge: REFRESH_DAYS * 24 * 60 * 60,
  };
}

export function clearRefreshCookie(reply, nodeEnv) {
  reply.clearCookie(REFRESH_COOKIE, {
    path: "/api/v1/auth",
    httpOnly: true,
    sameSite: "strict",
    secure: nodeEnv === "production",
  });
}

export function assertAuthCsrf(request) {
  const header = request.headers[CSRF_HEADER];
  if (header !== "1") {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Falta la cabecera anti-CSRF (X-MarketFlow-CSRF: 1).",
    );
  }

  const origin = request.headers.origin;
  const allowed = new Set([
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3001",
    "http://localhost:3001",
  ]);

  // En pruebas con PowerShell a veces no hay Origin; en navegador sí.
  if (origin && !allowed.has(origin)) {
    throw new AppError(403, "FORBIDDEN", "Origen no permitido.");
  }
}

export async function issueRefreshSession(prisma, reply, { userId, nodeEnv }) {
  const rawToken = randomBytes(32).toString("base64url");
  const familyId = randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshTokenSession.create({
    data: {
      userId,
      familyId,
      tokenHash: hashToken(rawToken),
      expiresAt,
    },
  });

  reply.setCookie(REFRESH_COOKIE, rawToken, cookieOptions(nodeEnv));

  return { familyId };
}

export async function rotateRefreshSession(prisma, reply, request, { nodeEnv }) {
  assertAuthCsrf(request);

  const rawToken = request.cookies[REFRESH_COOKIE];
  if (!rawToken) {
    throw new AppError(401, "UNAUTHENTICATED", "No hay sesión para renovar.");
  }

  const tokenHash = hashToken(rawToken);
  const session = await prisma.refreshTokenSession.findUnique({
    where: { tokenHash },
  });

  if (!session) {
    throw new AppError(401, "UNAUTHENTICATED", "Sesión inválida.");
  }

  // Reutilización o sesión ya cerrada: se revoca toda la familia.
  if (session.revokedAt || session.usedAt) {
    await prisma.refreshTokenSession.updateMany({
      where: { familyId: session.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    clearRefreshCookie(reply, nodeEnv);
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "Sesión reutilizada o revocada. Vuelve a iniciar sesión.",
    );
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    clearRefreshCookie(reply, nodeEnv);
    throw new AppError(401, "UNAUTHENTICATED", "La sesión ha caducado.");
  }

  const newRawToken = randomBytes(32).toString("base64url");
  const newExpiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.refreshTokenSession.update({
      where: { id: session.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshTokenSession.create({
      data: {
        userId: session.userId,
        familyId: session.familyId,
        tokenHash: hashToken(newRawToken),
        expiresAt: newExpiresAt,
      },
    }),
  ]);

  reply.setCookie(REFRESH_COOKIE, newRawToken, cookieOptions(nodeEnv));

  return { userId: session.userId, familyId: session.familyId };
}

export async function revokeRefreshFamily(prisma, reply, request, { nodeEnv }) {
  assertAuthCsrf(request);

  const rawToken = request.cookies[REFRESH_COOKIE];
  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    const session = await prisma.refreshTokenSession.findUnique({
      where: { tokenHash },
    });

    if (session) {
      await prisma.refreshTokenSession.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  clearRefreshCookie(reply, nodeEnv);
}
