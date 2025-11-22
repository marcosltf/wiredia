import crypto from "crypto";

const SUPPORTED = ["md5", "sha1", "sha256", "sha512"] as const;
type Algorithm = typeof SUPPORTED[number];

export function hashText(text: string, algorithm: string = "sha256"): string {
  const algo = algorithm.toLowerCase();

  if (!SUPPORTED.includes(algo as Algorithm)) {
    throw new Error(`Algoritmo inválido. Use um de: ${SUPPORTED.join(", ")}`);
  }

  return crypto.createHash(algo).update(text, "utf8").digest("hex");
}
