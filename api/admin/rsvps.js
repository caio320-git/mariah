const { sql, isAdmin, listRsvps } = require('../_lib');

module.exports = async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Não autorizado.' });

  if (req.method === 'GET') {
    try {
      const items = await listRsvps(req.query.q);
      const confirmed = items.filter((i) => i.attending);
      return res.status(200).json({
        items,
        stats: {
          responses: items.length,
          confirmedResponses: confirmed.length,
          declinedResponses: items.length - confirmed.length,
          totalPeople: confirmed.reduce((s, i) => s + i.totalPeople, 0),
        },
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Erro ao consultar.' });
    }
  }

  if (req.method === 'DELETE') {
    const id = Number(req.query.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });
    try {
      await sql`DELETE FROM guests WHERE rsvp_id = ${id}`;
      await sql`DELETE FROM rsvps WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Erro ao excluir.' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido.' });
};
