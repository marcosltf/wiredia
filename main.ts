import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";

// Carregar .env da raiz do projeto (não de dist/)
const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

import { hashText } from "./utils/hash";
import { compareHash } from "./utils/compare";
import { encodeBase64, decodeBase64 } from "./utils/base64";
import { eValido, formatCPF } from "./utils/cpf";
import { encodeHex, decodeHex } from "./utils/hex";
import { timestampToDate } from "./utils/time";
import { validarCep } from "./utils/cep";
import { getLatestTrack } from "./utils/lastfm";
import { getValor } from "./utils/valor";

import authRouter, { verifyUser } from "./auth";
import apiKeyRouter, { verifyApiKey } from "./apikey";
import db from "./database";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

const LOG_DIR = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logRequest = (data: Record<string, unknown>): void => {
  const today = new Date().toISOString().slice(0, 10);
  const filePath = path.join(LOG_DIR, `${today}.log`);
  const line = `${JSON.stringify(data)}\n`;

  fs.appendFile(filePath, line, err => {
    if (err) console.error("Erro ao gravar log:", err.message);
  });
};

// Função helper para extrair IP real
function getClientIp(req: express.Request): string {
  // Priorizar x-forwarded-for (quando atrás de proxy)
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) 
      ? forwardedFor 
      : forwardedFor.split(",").map(ip => ip.trim());
    // Pegar o primeiro IP (cliente original)
    const clientIp = ips[0];
    // Remover prefixo IPv6 ::ffff: se presente
    return clientIp.replace(/^::ffff:/, "");
  }

  // Tentar req.ip (se express trust proxy estiver configurado)
  if (req.ip && req.ip !== "::ffff:127.0.0.1" && req.ip !== "127.0.0.1") {
    return req.ip.replace(/^::ffff:/, "");
  }

  // Fallback para remoteAddress
  const remoteAddr = req.socket.remoteAddress;
  if (remoteAddr && remoteAddr !== "::ffff:127.0.0.1" && remoteAddr !== "127.0.0.1") {
    return remoteAddr.replace(/^::ffff:/, "");
  }

  return "unknown";
}

app.use((req, res, next) => {
  const ip = getClientIp(req);

  const startedAt = Date.now();

  res.on("finish", () => {
    // Coletar informações do usuário se disponíveis (após verifyApiKey)
    const reqAny = req as any;
    const now = new Date();
    const data = now.toLocaleDateString("pt-BR");
    const hora = now.toLocaleTimeString("pt-BR");

    const logData: Record<string, unknown> = {
      data,
      hora,
      ip,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - startedAt
    };

    // Adicionar email e API key se disponíveis (rotas que passam por verifyApiKey)
    if (reqAny.userEmail) {
      logData.user_email = reqAny.userEmail;
    }
    if (reqAny.apiKey) {
      logData.api_key = reqAny.apiKey;
    }

    logRequest(logData);
  });

  next();
});

// Rate limit simples: 100 requests/min
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;
const ipRequests = new Map<string, number[]>();

app.use((req, res, next) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const timestamps = ipRequests.get(ip) || [];
  const recent = timestamps.filter(ts => ts > windowStart);

  if (recent.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: "Máximo de 100 requisições por minuto por IP."
    });
  }

  recent.push(now);
  ipRequests.set(ip, recent);
  next();
});

// ROTAS DE LOGIN / REGISTRO (públicas)
app.use("/auth", authRouter);

// ROTAS DE API KEYS (exigem autenticação JWT)
app.use("/keys", apiKeyRouter);

// ROTAS DE PÁGINAS HTML (públicas, antes do verifyApiKey)
app.get("/", (req, res) => {
  res.redirect("/registrar");
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "login.html"));
});

app.get("/registrar", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "register.html"));
});

app.get("/panel", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "panel.html"));
});

// Helper para verificar se é admin
function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  const emailLower = email.toLowerCase().trim();
  const isAdminUser = adminEmails.includes(emailLower);
  
  // Debug log (remover em produção se necessário)
  if (process.env.NODE_ENV !== "production") {
    console.log("Admin check:", { email, emailLower, adminEmails, isAdminUser });
  }
  
  return isAdminUser;
}

// Rota /admin - serve HTML (proteção feita no frontend e nas rotas de dados)
app.get("/admin", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "admin.html"));
});

// ROTAS DE ADMIN (exigem autenticação JWT e verificação de admin)
app.get("/admin/users", verifyUser, (req: any, res) => {
  const user = db.prepare("SELECT email FROM users WHERE id = ?").get(req.userId) as { email: string } | undefined;
  if (!user || !isAdmin(user.email)) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const users = db.prepare(`
    SELECT 
      u.id,
      u.email,
      u.ip_registro,
      COALESCE(us.count, 0) as request_count
    FROM users u
    LEFT JOIN usage us ON u.id = us.user_id
    ORDER BY u.id DESC
  `).all() as Array<{ id: number; email: string; ip_registro: string | null; request_count: number }>;

  // Buscar API keys de cada usuário
  const usersWithKeys = users.map(user => {
    const keys = db.prepare("SELECT key, created_at FROM api_keys WHERE user_id = ?").all(user.id) as Array<{ key: string; created_at: number }>;
    return {
      ...user,
      api_keys: keys
    };
  });

  res.json(usersWithKeys);
});

app.get("/admin/logs", verifyUser, (req: any, res) => {
  const user = db.prepare("SELECT email FROM users WHERE id = ?").get(req.userId) as { email: string } | undefined;
  if (!user || !isAdmin(user.email)) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  // Validar e limitar o parâmetro limit para prevenir path traversal
  let limit = parseInt((req.query.limit as string) || "100");
  if (isNaN(limit) || limit < 1) limit = 100;
  if (limit > 1000) limit = 1000; // Máximo de 1000 logs por vez

  const today = new Date().toISOString().slice(0, 10);
  // Validar que a data está no formato correto (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    return res.status(400).json({ error: "Data inválida" });
  }
  const logFile = path.join(LOG_DIR, `${today}.log`);
  
  // Prevenir path traversal - garantir que o arquivo está dentro do LOG_DIR
  const resolvedPath = path.resolve(logFile);
  const resolvedDir = path.resolve(LOG_DIR);
  if (!resolvedPath.startsWith(resolvedDir)) {
    return res.status(400).json({ error: "Caminho inválido" });
  }

  if (!fs.existsSync(logFile)) {
    return res.json([]);
  }

  const lines = fs.readFileSync(logFile, "utf-8").trim().split("\n");
  const logs = lines
    .slice(-limit)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(log => log !== null)
    .reverse();

  res.json(logs);
});

// TUDO ABAIXO EXIGE API KEY (rotas da API)
app.use(verifyApiKey);

// =====================
// SUAS ROTAS DA API
// =====================

// GET /hash?text=hello
app.get("/hash", (req, res) => {
  const text = req.query.text as string;
  const algorithm = (req.query.algorithm as string) || "sha256";

  if (!text) return res.status(400).json({ error: "text obrigatório" });

  try {
    const hash = hashText(text, algorithm);
    res.json({ algorithm, hash });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /compare
app.post("/compare", (req, res) => {
  const { text, hash, algorithm } = req.body;
  if (!text || !hash) return res.status(400).json({ error: "text e hash obrigatórios" });

  try {
    const match = compareHash(text, hash, algorithm || "sha256");
    res.json({ algorithm: algorithm || "sha256", match });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /base64/encode
app.post("/base64/encode", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text obrigatório" });
  res.json({ encoded: encodeBase64(text) });
});

// POST /base64/decode
app.post("/base64/decode", (req, res) => {
  const { base64 } = req.body;
  if (!base64) return res.status(400).json({ error: "base64 obrigatório" });

  try {
    res.json({ decoded: decodeBase64(base64) });
  } catch {
    res.status(400).json({ error: "Base64 inválido" });
  }
});

// POST /cpf
app.post("/cpf", (req, res) => {
  const { cpf } = req.body;
  if (!cpf) return res.status(400).json({ error: "CPF obrigatório" });

  res.json({
    valid: eValido(cpf),
    formatted: formatCPF(cpf)
  });
});

// POST /cep
app.post("/cep", (req, res) => {
  const { cep } = req.body;
  if (!cep) return res.status(400).json({ erro: "Cep Obrigatorio" });

  const info = validarCep(cep);

  if (!info.valido) {
    return res.status(400).json({
      valido: false,
      erros: info.erros
    });
  }

  res.json(info);
});

// POST /hex/encode
app.post("/hex/encode", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text obrigatório" });
  res.json({ encoded: encodeHex(text) });
});

// POST /hex/decode
app.post("/hex/decode", (req, res) => {
  const { hex } = req.body;
  if (!hex) return res.status(400).json({ error: "hex obrigatório" });

  try {
    res.json({ decoded: decodeHex(hex) });
  } catch {
    res.status(400).json({ error: "Hexadecimal inválido" });
  }
});

// GET /timestamp
app.get("/timestamp", (req, res) => {
  const ts = (req.query.ts as string) || "";
  if (!ts) return res.status(400).json({ error: "ts obrigatório" });

  try {
    const dateObj = timestampToDate(ts);

    res.json({
      input: ts,
      iso: dateObj.toISOString(),
      locale: dateObj.toLocaleString("pt-BR"),
      utc: dateObj.toUTCString()
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? "timestamp inválido" });
  }
});

// GET /lastfm
app.get("/lastfm/:username", async (req, res) => {
  try {
    const track = await getLatestTrack(req.params.username);
    res.json(track);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /valor
app.get("/valor/:moeda", async (req, res) => {
  try {
    const price = await getValor(req.params.moeda.toUpperCase());
    res.json({ moeda: req.params.moeda, valor: price });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
