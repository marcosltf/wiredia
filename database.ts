import Database from "better-sqlite3";
import path from "path";

// Usar path absoluto para o database (na raiz do projeto)
const dbPath = path.resolve(process.cwd(), "app.db");
const db = new Database(dbPath);

// Tabela de usuários
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        ip_registro TEXT
    );
`).run();

// Adicionar coluna ip_registro se não existir (para bancos antigos)
try {
    db.prepare("ALTER TABLE users ADD COLUMN ip_registro TEXT").run();
} catch {
    // Coluna já existe, ignorar erro
}

// Tabela de API Keys
db.prepare(`
    CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        key TEXT UNIQUE,
        created_at INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
`).run();

// Contador de requisições
db.prepare(`
    CREATE TABLE IF NOT EXISTS usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        count INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
`).run();

export default db;
