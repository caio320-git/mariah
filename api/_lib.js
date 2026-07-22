/* Utilidades compartilhadas pelas funções serverless (Vercel) */
const crypto = require('node:crypto');
const { neon } = require('@neondatabase/serverless');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'mariah2026';
// Token determinístico derivado da senha — não há memória entre execuções serverless
const ADMIN_TOKEN = crypto.createHmac('sha256', ADMIN_PASSWORD).update('mariah-admin-v1').digest('hex');

// Conexão criada só no primeiro uso (o login, por exemplo, não precisa do banco)
let _client;
function getClient() {
  if (!_client) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('DATABASE_URL não configurada — crie o banco Neon na aba Storage da Vercel.');
    _client = neon(url);
  }
  return _client;
}
const sql = (...args) => getClient()(...args);

let schemaReady;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS rsvps (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        attending BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        rsvp_id INTEGER NOT NULL REFERENCES rsvps(id) ON DELETE CASCADE,
        name TEXT NOT NULL
      )`;
    })();
  }
  return schemaReady;
}

function getBody(req) {
  // A Vercel já entrega req.body parseado quando o Content-Type é application/json
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return null; }
}

function cleanName(v, max = 120) {
  if (typeof v !== 'string') return null;
  const s = v.replace(/\s+/g, ' ').trim();
  if (!s || s.length > max) return null;
  return s;
}

function isAdmin(req) {
  const header = req.headers['authorization'] || '';
  const token = header.replace(/^Bearer\s+/i, '') || (req.query && req.query.token) || '';
  return token === ADMIN_TOKEN;
}

function checkPassword(password) {
  const a = Buffer.from(String(password));
  const b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function listRsvps(query) {
  await ensureSchema();
  const q = (query || '').trim().toLowerCase();
  const rows = await sql`SELECT id, name, attending, created_at FROM rsvps ORDER BY id DESC`;
  const guestRows = await sql`SELECT rsvp_id, name FROM guests ORDER BY id`;
  const guestsBy = new Map();
  for (const g of guestRows) {
    if (!guestsBy.has(g.rsvp_id)) guestsBy.set(g.rsvp_id, []);
    guestsBy.get(g.rsvp_id).push(g.name);
  }
  const result = [];
  for (const r of rows) {
    const guests = guestsBy.get(r.id) || [];
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
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    });
  }
  return result;
}

module.exports = { sql, ensureSchema, getBody, cleanName, isAdmin, checkPassword, listRsvps, ADMIN_TOKEN };
