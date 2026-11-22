export function isValidPisPasep(pis: string): boolean {
  return /^\d{3}\.\d{5}\.\d{2}-\d{1}$/.test(pis.trim());
}

export function formatPisPasep(valor: string): string {
  if (isValidPisPasep(valor)) {
    return valor.trim();
  } else {
    const digitos = valor.replace(/\D/g, "").slice(0, 11);
    return digitos
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{5})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{5})\.(\d{2})(\d)/, "$1.$2.$3-$4");
  }
}
