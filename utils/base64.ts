/**
 * Codifica um texto em Base64.
 * @param text Texto original
 * @returns Texto codificado em Base64
 */
export function encodeBase64(text: string): string {
    return Buffer.from(text, "utf-8").toString("base64");
}

/**
 * converte um base64 para texto original
 * @param base64 texto em base64
 * @returns texto original decodificado
 */

export function decodeBase64(base64: string): string {
    return Buffer.from(base64, "base64").toString("utf-8");
}