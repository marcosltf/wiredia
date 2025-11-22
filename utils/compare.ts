import { hashText } from "./hash";

/**
 * Compara um texto com um hash dado, usando um algoritmo específico.
 * @param text Texto original
 * @param hash Hash a ser comparado
 * @param algorithm Algoritmo de hash (default: sha256)
 * @returns true se o hash corresponder ao texto, false caso contrário
 */
export function compareHash(text: string, hash: string, algorithm: string = "sha256"): boolean {
  const generatedHash = hashText(text, algorithm);
  return generatedHash === hash;
}
