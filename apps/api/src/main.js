import Fastify from "fastify";
import { loadEnv } from "./env.js";
import { registerErrorHandlers } from "./errors.js";

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

app.get("/health/live", async function live() {
  return { status: "ok" };
});

app.get("/health/ready", async function ready() {
  return { status: "ok" };
});

if (env.NODE_ENV === "development") {
  app.get("/__debug/boom", async function boom() {
    throw new Error("Fallo de prueba; el cliente no debe ver este texto");
  });
}

registerErrorHandlers(app);

await app.listen({ port: env.PORT, host: "0.0.0.0" });
