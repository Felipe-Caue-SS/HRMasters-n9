export function isValidCPF(cpf: string): boolean {
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf.trim());
}

export function formatCPF(valor: string): string {
  if (isValidCPF(valor)) {
    return valor.trim();
  } else {
    const digitos = valor.replace(/\D/g, "").slice(0, 11);

    return digitos
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }
}
