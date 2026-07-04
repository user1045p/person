import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'crawl.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    title TEXT,
    raw_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const insertStmt = db.prepare(
  'INSERT INTO items (url, title, raw_json) VALUES (@url, @title, @raw_json)'
);

export function insertData(item) {
  insertStmt.run({
    url: item.url,
    title: item.title,
    raw_json: JSON.stringify(item),
  });
}

export function getRecentData(limit = 100) {
  return db.prepare('SELECT * FROM items ORDER BY created_at DESC LIMIT ?').all(limit);
}