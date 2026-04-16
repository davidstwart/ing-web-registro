function calcularPermanencia(entrada, salida) {
  if (!entrada || !salida) return "En curso";

  const inicio = new Date(entrada);
  const fin = new Date(salida);
  const diffMs = fin - inicio;

  if (diffMs < 0) return "Error en horas";

  const horas = Math.floor(diffMs / 3600000);
  const minutos = Math.floor((diffMs % 3600000) / 60000);

  return `${horas}h ${minutos}m`;
}

module.exports = { calcularPermanencia };