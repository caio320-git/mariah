const { getBody, checkPassword, ADMIN_TOKEN } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  const body = getBody(req);
  if (!body || typeof body.password !== 'string') return res.status(400).json({ error: 'Senha obrigatória.' });
  if (!checkPassword(body.password)) return res.status(401).json({ error: 'Senha incorreta.' });
  return res.status(200).json({ token: ADMIN_TOKEN });
};
