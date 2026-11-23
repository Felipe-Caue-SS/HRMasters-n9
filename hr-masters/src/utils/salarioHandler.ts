export function isValidSalario(salario: string): boolean {
  return /^R\$ \d+,\d{2}$/.test(salario.trim());
}

export function formatSalario(valor: string | number): string {
  const raw = String(valor).trim();
  if (!raw) return "";

  if (isValidSalario(raw)) {
    return raw;
  } else {
    let centavos: number;
    if (typeof valor === "number") {
      centavos = Math.round(valor * 100);
    } else {
      const apenasDigitos = raw.replace(/\D/g, "");
      if (!apenasDigitos) return "";
      centavos = Number(apenasDigitos);
    }

    const reais = (centavos / 100).toFixed(2).replace(".", ",");
    return `R$ ${reais}`;
  }
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}