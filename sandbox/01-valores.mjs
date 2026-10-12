const producto = {
  title: "Café de origen",
  priceCents: 1290,
};

function describir(item) {
  return item.title + " vale " + item.priceCents + " céntimos";
}

console.log("Motor: Node " + process.version);
console.log(describir(producto));
