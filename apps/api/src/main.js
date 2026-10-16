import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import { loadEnv } from "./env.js";
import { registerErrorHandlers } from "./errors.js";
import prismaPlugin from "./plugins/prisma.js";
import { registerRoutes } from "./modules/auth/register.js";
import { loginRoutes } from "./modules/auth/login.js";
import { sessionRoutes } from "./modules/auth/session.js";
import { meRoutes } from "./modules/users/me.js";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
loadDotenv({ path: resolve(rootDir, ".env") });

let env;

try {
  env = loadEnv();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const app = Fastify({
  logger: true,
});

app.decorate("config", env);

await app.register(fastifyCookie);
await app.register(prismaPlugin);

app.get("/health/live", async function live() {
  return { status: "ok" };
});

app.get("/health/ready", async function ready(request, reply) {
  try {
    await app.prisma.$queryRaw`SELECT 1`;
    return { status: "ok" };
  } catch (error) {
    request.log.error(error);
    return reply.status(503).send({ status: "not_ready" });
  }
});

await app.register(registerRoutes, { prefix: "/api/v1/auth" });
await app.register(loginRoutes, { prefix: "/api/v1/auth" });
await app.register(sessionRoutes, { prefix: "/api/v1/auth" });
await app.register(meRoutes, { prefix: "/api/v1/users" });

if (env.NODE_ENV === "development") {
  app.get("/__debug/boom", async function boom() {
    throw new Error("Fallo de prueba; el cliente no debe ver este texto");
  });
}

registerErrorHandlers(app);

await app.listen({ port: env.PORT, host: "0.0.0.0" });
