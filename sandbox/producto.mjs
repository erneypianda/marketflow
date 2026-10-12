export const producto = {
  title: "Café de origen",
  priceCents: 1290,
};

export function describir(item) {
  return item.title + " vale " + item.priceCents + " céntimos";
}
