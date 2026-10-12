function reservar(cantidad) {
  return new Promise((resolver, rechazar) => {
    setTimeout(() => {
      if (cantidad > 10) {
        rechazar(new Error("No hay stock suficiente"));
        return;
      }

      resolver("Reserva aceptada: " + cantidad);
    }, 100);
  });
}

try {
  const ok = await reservar(2);
  console.log(ok);

  const falla = await reservar(20);
  console.log(falla);
} catch (error) {
  console.log("La operación no siguió: " + error.message);
}

console.log("El proceso sigue vivo");
