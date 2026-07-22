/*
 * Le Cirque de Mariah — servidor de confirmação de presença (RSVP)
 * Node.js puro (>= 22.5), sem dependências externas. Banco: SQLite embutido.
 *
 * Rodar:   node server.js
 * Config:  PORT (padrão 3000) | ADMIN_PASSWORD (padrão "mariah2026")
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'mariah2026';
const SESSION_SECRET = crypto.randomBytes(32).toString('hex');
const ADMIN_TOKEN = crypto.createHmac('sha256', SESSION_SECRET).update('admin').digest('hex');

const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'rsvps.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    attending INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
  CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rsvp_id INTEGER NOT NULL REFERENCES rsvps(id) ON DELETE CASCADE,
    name TEXT NOT NULL
  );
`);
db.exec('PRAGMA foreign_keys = ON;');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 64 * 1024) { req.destroy(); reject(new Error('payload too large')); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(new Error('invalid json')); }
    });
    req.on('error', reject);
  });
}

function cleanName(v, max = 120) {
  if (typeof v !== 'string') return null;
  const s = v.replace(/\s+/g, ' ').trim();
  if (!s || s.length > max) return null;
  return s;
}

function isAdmin(req, url) {
  const header = req.headers['authorization'] || '';
  const token = header.replace(/^Bearer\s+/i, '') || url.searchParams.get('token') || '';
  return token === ADMIN_TOKEN;
}

function listRsvps(query) {
  const q = (query || '').trim().toLowerCase();
  const rows = db.prepare('SELECT id, name, attending, created_at FROM rsvps ORDER BY id DESC').all();
  const guestStmt = db.prepare('SELECT name FROM guests WHERE rsvp_id = ? ORDER BY id');
  const result = [];
  for (const r of rows) {
    const guests = guestStmt.all(r.id).map((g) => g.name);
    if (q) {
      const haystack = [r.name, ...guests].join(' ').toLowerCase();
      if (!haystack.includes(q)) continue;
    }
    result.push({
      id: r.id,
      name: r.name,
      attending: !!r.attending,
      guests,
      totalPeople: r.attending ? 1 + guests.length : 0,
      createdAt: r.created_at,
    });
  }
  return result;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = url.pathname;

  try {
    // ---------- API ----------
    if (p === '/api/rsvp' && req.method === 'POST') {
      const body = await readBody(req).catch(() => null);
      if (!body) return sendJSON(res, 400, { error: 'Dados inválidos.' });

      const name = cleanName(body.name);
      if (!name) return sendJSON(res, 400, { error: 'Informe um nome válido.' });
      const attending = body.attending === true;

      let guests = [];
      if (attending && Array.isArray(body.guests)) {
        if (body.guests.length > 20) return sendJSON(res, 400, { error: 'Número de acompanhantes muito alto.' });
        for (const g of body.guests) {
          const gn = cleanName(g);
          if (!gn) return sendJSON(res, 400, { error: 'Preencha o nome de todos os acompanhantes.' });
          guests.push(gn);
        }
      }

      const info = db.prepare('INSERT INTO rsvps (name, attending) VALUES (?, ?)').run(name, attending ? 1 : 0);
      const rsvpId = info.lastInsertRowid;
      const ins = db.prepare('INSERT INTO guests (rsvp_id, name) VALUES (?, ?)');
      for (const g of guests) ins.run(rsvpId, g);

      return sendJSON(res, 201, { ok: true, id: Number(rsvpId) });
    }

    if (p === '/api/admin/login' && req.method === 'POST') {
      const body = await readBody(req).catch(() => null);
      if (!body || typeof body.password !== 'string') return sendJSON(res, 400, { error: 'Senha obrigatória.' });
      const a = Buffer.from(body.password);
      const b = Buffer.from(ADMIN_PASSWORD);
      const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
      if (!ok) return sendJSON(res, 401, { error: 'Senha incorreta.' });
      return sendJSON(res, 200, { token: ADMIN_TOKEN });
    }

    if (p === '/api/admin/rsvps' && req.method === 'GET') {
      if (!isAdmin(req, url)) return sendJSON(res, 401, { error: 'Não autorizado.' });
      const items = listRsvps(url.searchParams.get('q'));
      const confirmed = items.filter((i) => i.attending);
      return sendJSON(res, 200, {
        items,
        stats: {
          responses: items.length,
          confirmedResponses: confirmed.length,
          declinedResponses: items.length - confirmed.length,
          totalPeople: confirmed.reduce((s, i) => s + i.totalPeople, 0),
        },
      });
    }

    if (p === '/api/admin/rsvps' && req.method === 'DELETE') {
      if (!isAdmin(req, url)) return sendJSON(res, 401, { error: 'Não autorizado.' });
      const id = Number(url.searchParams.get('id'));
      if (!Number.isInteger(id)) return sendJSON(res, 400, { error: 'id inválido' });
      db.prepare('DELETE FROM guests WHERE rsvp_id = ?').run(id);
      db.prepare('DELETE FROM rsvps WHERE id = ?').run(id);
      return sendJSON(res, 200, { ok: true });
    }

    if ((p === '/api/admin/export' || p === '/api/admin/export.csv') && req.method === 'GET') {
      if (!isAdmin(req, url)) return sendJSON(res, 401, { error: 'Não autorizado.' });
      const items = listRsvps('');
      const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
      const lines = ['Nome;Tipo;Confirmou presença;Convidado por;Respondido em'];
      for (const it of items) {
        const status = it.attending ? 'Sim' : 'Não';
        lines.push([esc(it.name), 'Convidado principal', status, '', esc(it.createdAt)].join(';'));
        for (const g of it.guests) {
          lines.push([esc(g), 'Acompanhante', status, esc(it.name), esc(it.createdAt)].join(';'));
        }
      }
      const csv = '﻿' + lines.join('\r\n'); // BOM p/ Excel abrir acentos corretamente
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="confirmados-mariah.csv"',
      });
      return res.end(csv);
    }

    if (p.startsWith('/api/')) return sendJSON(res, 404, { error: 'Rota não encontrada.' });

    // ---------- Arquivos estáticos ----------
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405); return res.end();
    }
    let filePath = p === '/' ? '/index.html' : (p === '/admin' ? '/admin.html' : p);
    filePath = path.normalize(filePath).replace(/^([.][.][/\\])+/, '');
    const abs = path.join(PUBLIC_DIR, filePath);
    if (!abs.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }

    fs.readFile(abs, (err, data) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Página não encontrada'); }
      const ext = path.extname(abs).toLowerCase();
      const cache = ext === '.html' ? 'no-cache' : 'public, max-age=86400';
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': cache });
      res.end(data);
    });
  } catch (e) {
    console.error(e);
    sendJSON(res, 500, { error: 'Erro interno.' });
  }
});

server.listen(PORT, () => {
  console.log(`🎪 Le Cirque de Mariah no ar: http://localhost:${PORT}`);
  console.log(`   Área administrativa:      http://localhost:${PORT}/admin`);
  console.log(`   Senha admin: ${ADMIN_PASSWORD === 'mariah2026' ? 'mariah2026 (padrão — defina ADMIN_PASSWORD para trocar)' : '(definida via ADMIN_PASSWORD)'}`);
});
