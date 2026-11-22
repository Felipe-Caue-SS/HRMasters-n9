export function isValidTelefone(telefone: string): boolean {
  return /^\+\d{2} \(\d{2}\) \d{5} - \d{4}$/.test(telefone.trim());
}

export function formatTelefone(valor: string): string {
  if (isValidTelefone(valor)) {
    return valor.trim();
  } else {
    const digitos = valor.replace(/\D/g, "").slice(0, 13);
    const ddi = digitos.slice(0, 2);
    const ddd = digitos.slice(2, 4);
    const numero = digitos.slice(4);

    if (!ddi) return "";
    if (digitos.length <= 2) return `+${ddi}`;
    if (digitos.length <= 4) return `+${ddi} (${ddd}`;

    const parte1 = numero.slice(0, 5);
    const parte2 = numero.slice(5, 9);

    if (numero.length <= 5) {
      return `+${ddi} (${ddd}) ${parte1}`;
    }
    return `+${ddi} (${ddd}) ${parte1} - ${parte2}`;
  }
}
