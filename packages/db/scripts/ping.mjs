import { prisma } from "../src/index.js";

try {
  const rows = await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log("Conexión OK:", rows);

  const users = await prisma.user.count();
  const categories = await prisma.category.count();
  const products = await prisma.product.count();
  const sellers = await prisma.sellerProfile.count();

  console.log("users:", users);
  console.log("seller_profiles:", sellers);
  console.log("categories:", categories);
  console.log("products:", products);
} catch (error) {
  console.error("No se pudo hablar con PostgreSQL:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
