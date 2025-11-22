// utils/time.ts
export function timestampToDate(ts: string | number): Date {
    const n = Number(ts);
    if (Number.isNaN(n)) throw new Error("timestamp inválido");
    // se tiver 10 dígitos ou menos, assume segundos -> converte para ms
    const ms = n < 1e11 ? n * 1000 : n;
    return new Date(ms);
  }
  