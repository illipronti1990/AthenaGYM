export type CepAddress = {
  zipcode: string;
  street: string;
  district: string;
  city: string;
  state: string;
};

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Consulta CEP via ViaCEP (base pública dos Correios). */
export async function lookupCep(cep: string): Promise<CepAddress> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos');
  }

  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error('Falha ao consultar o CEP');
  }

  const data = (await res.json()) as {
    erro?: boolean | string;
    cep?: string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };

  if (data.erro) {
    throw new Error('CEP não encontrado');
  }

  return {
    zipcode: formatCep(data.cep || digits),
    street: data.logradouro || '',
    district: data.bairro || '',
    city: data.localidade || '',
    state: data.uf || '',
  };
}
