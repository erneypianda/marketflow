import fp from "fastify-plugin";
import { prisma } from "@marketflow/db";

async function prismaPlugin(app) {
  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
}

export default fp(prismaPlugin);
