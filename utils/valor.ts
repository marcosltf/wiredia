// Using native fetch (Node.js 18+)

const DEFAULT_VS = "BRL";
const SUPPORTED_FIAT = new Set(["USD", "BRL", "EUR"]);
const FIAT_RATE_CACHE = new Map<string, { rates: Record<string, number>; expires: number }>();
const FIAT_CACHE_TTL = 1000 * 60 * 10; // 10 minutos
const CRYPTO_PRICE_CACHE = new Map<string, { value: number; expires: number }>();
const CRYPTO_CACHE_TTL = 1000 * 60 * 2; // 2 minutos

async function convertFiat(symbol: string, vs: string): Promise<number> {
  if (symbol === vs) return 1;

  const cacheKey = symbol;
  const cached = FIAT_RATE_CACHE.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    const rate = cached.rates[vs];
    if (typeof rate === "number") return rate;
  }

  const res = await fetch(`https://open.er-api.com/v6/latest/${symbol}`);

  if (!res.ok) throw new Error("Falha ao buscar cotação fiat");

  const data = (await res.json()) as {
    result?: string;
    rates?: Record<string, number>;
  };

  if (data.result !== "success" || !data.rates) {
    throw new Error("Cotação fiat indisponível");
  }

  const rate = data.rates[vs];

  if (typeof rate !== "number") throw new Error("Conversão fiat não suportada");

  FIAT_RATE_CACHE.set(cacheKey, {
    rates: data.rates,
    expires: Date.now() + FIAT_CACHE_TTL,
  });

  return rate;
}

async function getCryptoPrice(symbol: string, vs: string): Promise<number> {
  const cacheKey = `${symbol}-${vs}`;
  const cached = CRYPTO_PRICE_CACHE.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.value;

  const res = await fetch(
    `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=${vs}`
  );

  if (!res.ok) throw new Error("Falha ao buscar preço da cripto");

  const data = (await res.json()) as Record<string, number | string>;

  if ("Response" in data && data.Response === "Error") {
    throw new Error((data.Message as string) || "Cripto não suportada");
  }

  const value = data[vs];
  if (typeof value !== "number") throw new Error("Preço da cripto indisponível");

  CRYPTO_PRICE_CACHE.set(cacheKey, {
    value,
    expires: Date.now() + CRYPTO_CACHE_TTL,
  });

  return value;
}

export async function getValor(symbol: string, vs: string = DEFAULT_VS): Promise<number> {
  const upperSymbol = symbol.toUpperCase();
  const target = vs.toUpperCase();

  if (SUPPORTED_FIAT.has(upperSymbol)) {
    return convertFiat(upperSymbol, target);
  }

  return getCryptoPrice(upperSymbol, target);
}
