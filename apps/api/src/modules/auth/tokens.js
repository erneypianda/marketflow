import { SignJWT } from "jose";

/**
 * Crea el access token (JWT ~15 min).
 * Claims mínimos de la Parte 1: sub, roles, sid.
 * sid = familyId de la sesión de refresh.
 */
export async function createAccessToken({ userId, roles, sid, jwtSecret }) {
  const secret = new TextEncoder().encode(jwtSecret);

  return new SignJWT({ roles, sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}
