function leerStock(nombre) {
  return new Promise((resolver) => {
    setTimeout(() => {
      resolver(nombre + ": 10 unidades");
    }, 150);
  });
}

console.log("1. Inicio");

const cafe = await leerStock("Café");
console.log("2. " + cafe);

const te = await leerStock("Té");
console.log("3. " + te);

console.log("4. Fin");
