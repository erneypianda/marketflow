import { readFile } from "node:fs/promises";

const texto = await readFile(new URL("./ejemplo.env", import.meta.url), "utf8");

const config = {};

for (const linea of texto.split("\n")) {
  const limpia = linea.trim();

  if (limpia === "" || limpia.startsWith("#")) {
    continue;
  }

  const igual = limpia.indexOf("=");
  const clave = limpia.slice(0, igual);
  const valor = limpia.slice(igual + 1);
  config[clave] = valor;
}

console.log("Nombre: " + config.APP_NAME);
console.log("Puerto: " + config.PORT);
console.log("NODE_ENV de proceso: " + (process.env.NODE_ENV || "sin definir"));
