const { sql, ensureSchema, getBody, cleanName } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const body = getBody(req);
  if (!body) return res.status(400).json({ error: 'Dados inválidos.' });

  const name = cleanName(body.name);
  if (!name) return res.status(400).json({ error: 'Informe um nome válido.' });
  const attending = body.attending === true;

  const guests = [];
  if (attending && Array.isArray(body.guests)) {
    if (body.guests.length > 20) return res.status(400).json({ error: 'Número de acompanhantes muito alto.' });
    for (const g of body.guests) {
      const gn = cleanName(g);
      if (!gn) return res.status(400).json({ error: 'Preencha o nome de todos os acompanhantes.' });
      guests.push(gn);
    }
  }

  try {
    await ensureSchema();
    const inserted = await sql`INSERT INTO rsvps (name, attending) VALUES (${name}, ${attending}) RETURNING id`;
    const rsvpId = inserted[0].id;
    if (guests.length) {
      await sql`INSERT INTO guests (rsvp_id, name) SELECT ${rsvpId}, unnest(${guests}::text[])`;
    }
    return res.status(201).json({ ok: true, id: rsvpId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao salvar. Tente novamente.' });
  }
};
