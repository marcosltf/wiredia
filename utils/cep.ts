// Utilidades para CEP brasileiro

export interface CepInfo {
  valido: boolean;
  cep_limpo: string | null;     // só dígitos (8 chars)
  cep_formatado: string | null; // 00000-000
  regiao: string | null;
  erros: string[];
}

const REGION_MAP: Record<string, string> = {
  "0": "Grande São Paulo",
  "1": "Interior de São Paulo",
  "2": "Rio de Janeiro e Espírito Santo",
  "3": "Minas Gerais",
  "4": "Bahia e Sergipe",
  "5": "Pernambuco, Alagoas, Paraíba e Rio Grande do Norte",
  "6": "Ceará, Piauí, Maranhão e Pará",
  "7": "Amazonas, Acre, Rondônia, Roraima e Amapá",
  "8": "Paraná e Santa Catarina",
  "9": "Rio Grande do Sul",
};

export function validarCep(raw: string): CepInfo {
  const erros: string[] = [];

  if (!raw || typeof raw !== "string") {
    return {
      valido: false,
      cep_limpo: null,
      cep_formatado: null,
      regiao: null,
      erros: ["Cep deve ser uma string nao vazia"],
    };
  }

  // remove tudo que não for dígito
  const digits = raw.replace(/\D/g, "");

  if (digits.length !== 8) {
    erros.push("Cep deve conter exatamente 8 digitos");
  }

  if (!/^\d{8}$/.test(digits)) {
    erros.push("Cep deve conter apenas numeros");
  }

  const valido = erros.length === 0;

  if (!valido) {
    return {
      valido: false,
      cep_limpo: null,
      cep_formatado: null,
      regiao: null,
      erros,
    };
  }

  const formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
  const region = REGION_MAP[digits[0]] ?? null;

  return {
    valido: true,
    cep_limpo: digits,
    cep_formatado: formatted,
    regiao: region,
    erros: [],
  };
}

