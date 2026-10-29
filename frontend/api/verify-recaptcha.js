export default async function handler(req, res) {
  // Configuração de CORS se necessário
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { token } = req.body || {};

  if (!token) {
    return res.status(400).json({ success: false, error: 'Token do reCAPTCHA não fornecido.' });
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.log('⚠️ [reCAPTCHA] RECAPTCHA_SECRET_KEY não configurada no servidor. Ignorando validação.');
    return res.json({ success: true, message: 'Bypass: Secret Key não configurada no servidor.' });
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`
    });

    const data = await response.json();

    if (data.success && data.score >= 0.5) {
      console.log(`✅ [reCAPTCHA] Verificado com sucesso. Score: ${data.score}`);
      return res.json({ success: true, score: data.score });
    } else {
      console.warn(`❌ [reCAPTCHA] Verificação falhou ou score suspeito. Score: ${data.score || 'N/A'}`);
      return res.status(400).json({
        success: false,
        error: 'Verificação anti-spam do reCAPTCHA falhou ou comportamento suspeito detectado.',
        details: data
      });
    }
  } catch (error) {
    console.error('❌ [reCAPTCHA] Erro ao verificar:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erro de comunicação com o servidor do reCAPTCHA.',
      detalhes: error.message
    });
  }
}
