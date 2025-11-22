import { Router } from "express";
import db from "./database";
import crypto from "crypto";
import { verifyUser } from "./auth";

interface ApiKey {
    user_id: number;
}

interface User {
    id: number;
    email: string;
}

const router = Router();

// Gerar nova chave
router.post("/generate-key", verifyUser, (req: any, res) => {
    const key = crypto.randomBytes(24).toString("hex");

    db.prepare("INSERT INTO api_keys (user_id, key, created_at) VALUES (?, ?, ?)").run(
        req.userId,
        key,
        Date.now()
    );

    // Inicializar contador se não existir
    const usage = db.prepare("SELECT * FROM usage WHERE user_id = ?").get(req.userId);
    if (!usage) {
        db.prepare("INSERT INTO usage (user_id, count) VALUES (?, 0)").run(req.userId);
    }

    res.json({ key });
});

// Buscar estatísticas do usuário
router.get("/stats", verifyUser, (req: any, res) => {
    const userCount = db.prepare("SELECT count FROM usage WHERE user_id = ?").get(req.userId) as { count: number } | undefined;
    const totalCount = db.prepare("SELECT SUM(count) as total FROM usage").get() as { total: number | null } | undefined;
    const userKeys = db.prepare("SELECT key, created_at FROM api_keys WHERE user_id = ?").all(req.userId) as Array<{ key: string; created_at: number }>;

    res.json({
        user_requests: userCount?.count || 0,
        total_requests: totalCount?.total || 0,
        api_keys: userKeys
    });
});

// Middleware para validar API key nas rotas
export function verifyApiKey(req: any, res: any, next: any) {
    const key = req.headers["x-api-key"];
    if (!key) return res.status(401).json({ error: "Falta API Key" });

    const found = db.prepare("SELECT user_id FROM api_keys WHERE key = ?").get(key) as ApiKey | undefined;

    if (!found) return res.status(401).json({ error: "API Key inválida" });

    // Buscar email do usuário
    const user = db.prepare("SELECT email FROM users WHERE id = ?").get(found.user_id) as User | undefined;

    req.userId = found.user_id;
    req.userEmail = user?.email || null;
    req.apiKey = key;

    // Inicializar contador se não existir, depois incrementar
    const usage = db.prepare("SELECT * FROM usage WHERE user_id = ?").get(found.user_id);
    if (!usage) {
        db.prepare("INSERT INTO usage (user_id, count) VALUES (?, 0)").run(found.user_id);
    }
    
    db.prepare(`
        UPDATE usage SET count = count + 1 WHERE user_id = ?
    `).run(found.user_id);

    next();
}

export default router;
