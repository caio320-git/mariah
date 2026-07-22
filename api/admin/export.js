const { isAdmin, listRsvps } = require('../_lib');

const fmtDate = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  if (!isAdmin(req)) return res.status(401).json({ error: 'Não autorizado.' });

  try {
    const items = await listRsvps('');
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = ['Nome;Tipo;Confirmou presença;Convidado por;Respondido em'];
    for (const it of items) {
      const status = it.attending ? 'Sim' : 'Não';
      const when = fmtDate.format(new Date(it.createdAt));
      lines.push([esc(it.name), 'Convidado principal', status, '', esc(when)].join(';'));
      for (const g of it.guests) {
        lines.push([esc(g), 'Acompanhante', status, esc(it.name), esc(when)].join(';'));
      }
    }
    const csv = '﻿' + lines.join('\r\n'); // BOM p/ Excel abrir acentos corretamente
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="confirmados-mariah.csv"');
    return res.status(200).send(csv);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao exportar.' });
  }
};
