// Converte texto para hexadecimal
export function encodeHex(text: string): string {
    return Buffer.from(text, "utf-8").toString("hex");
  }
  
  // Converte hexadecimal para texto
  export function decodeHex(hex: string): string {
    return Buffer.from(hex, "hex").toString("utf-8");
  }
  