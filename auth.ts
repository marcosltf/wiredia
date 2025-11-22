import dotenv from "dotenv";
import path from "path";

// Carregar .env da raiz do projeto
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
import { Router } from "express";
import db from "./database";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

interface User {
    id: number;
    email: string;
    password: string;
}

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "super_secreto";

// Helper para verificar se é admin
function isAdmin(email: string): boolean {
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
    const emailLower = email.toLowerCase().trim();
    const isAdminUser = adminEmails.includes(emailLower);
    
    // Debug log
    if (process.env.NODE_ENV !== "production") {
        console.log("Admin check:", { email, emailLower, adminEmails, isAdminUser });
    }
    
    return isAdminUser;
}

// Função helper para pegar IP
function getClientIp(req: any): string {
    const forwardedFor = req.headers["x-forwarded-for"];
    const forwardedIp = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor?.split(",")[0]?.trim();
    
    return forwardedIp || req.socket.remoteAddress || req.ip || "unknown";
}

// Validação de email
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
}

// Validação de senha
function isValidPassword(password: string): boolean {
    return password.length >= 8 && password.length <= 100;
}

// Registro
router.post("/register", (req, res) => {
    const { email, password } = req.body;

    // Validação de entrada
    if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email obrigatório" });
    }
    if (!password || typeof password !== "string") {
        return res.status(400).json({ error: "Senha obrigatória" });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Email inválido" });
    }
    if (!isValidPassword(password)) {
        return res.status(400).json({ error: "Senha deve ter entre 8 e 100 caracteres" });
    }

    const ip = getClientIp(req);
    const hash = bcrypt.hashSync(password, 10);

    try {
        db.prepare("INSERT INTO users (email, password, ip_registro) VALUES (?, ?, ?)").run(email, hash, ip);
        res.json({ message: "Registrado!" });
    } catch {
        res.status(400).json({ error: "Email já existe." });
    }
});

// Login
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    // Validação de entrada
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
        return res.status(400).json({ error: "Email e senha obrigatórios" });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;
    if (!user) return res.status(400).json({ error: "Usuário não encontrado" });

    if (!bcrypt.compareSync(password, user.password))
        return res.status(401).json({ error: "Senha errada" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, email: user.email });
});

// Middleware para verificar se é admin
export function verifyAdmin(req: any, res: any, next: any) {
    verifyUser(req, res, () => {
        const user = db.prepare("SELECT email FROM users WHERE id = ?").get(req.userId) as User | undefined;
        if (!user || !isAdmin(user.email)) {
            return res.status(403).json({ error: "Acesso negado" });
        }
        next();
    });
}

// Middleware de autenticação
export function verifyUser(req: any, res: any, next: any) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "Sem token" });

    try {
        const decoded = jwt.verify(auth.split(" ")[1], JWT_SECRET) as any;
        req.userId = decoded.id;
        next();
    } catch {
        res.status(401).json({ error: "Token inválido" });
    }
}

export default router;
