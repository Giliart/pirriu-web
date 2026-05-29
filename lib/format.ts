export function moneyBRL(value: number | string | null | undefined) {
  const number = Number(value || 0);
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
