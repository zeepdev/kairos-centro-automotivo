import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
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

  const { email, origin } = req.body || {};

  if (!email) {
    return res.status(400).json({ success: false, error: 'E-mail não fornecido.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qrzqvvvscruohlgypmvb.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseKey || !resendApiKey) {
    return res.status(500).json({ success: false, error: 'Serviço de e-mail não configurado completamente no servidor.' });
  }

  const targetOrigin = origin || 'https://www.kairoscentroautomotivo.com';
  const redirectTo = `${targetOrigin}/reset-password`;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    // 1. Gera link de recuperação com o redirect_to exato e funcional
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim().toLowerCase(),
      options: { redirectTo }
    });

    if (linkError) {
      console.error('❌ [ForgotPassword] Erro ao gerar link:', linkError);
      return res.status(400).json({ success: false, error: linkError.message });
    }

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      return res.status(500).json({ success: false, error: 'Não foi possível gerar o link de recuperação.' });
    }

    // 2. Dispara e-mail profissional via Resend com a identidade Kairós
    const emailResult = await resend.emails.send({
      from: 'Kairós Centro Automotivo <contato@kairoscentroautomotivo.com>',
      to: [email.trim().toLowerCase()],
      subject: 'Recuperação de Senha - Kairós Centro Automotivo',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0c0c0c; color: #ffffff; margin: 0; padding: 40px 20px; }
            .container { max-width: 580px; margin: 0 auto; background-color: #141416; border: 1px solid #27272a; border-radius: 14px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
            .header { background: linear-gradient(180deg, #18181b 0%, #111113 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #ae0d05; }
            .header h1 { margin: 0; color: #ae0d05; font-size: 22px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; }
            .content { padding: 36px 28px; text-align: center; }
            .content h2 { color: #ffffff; margin-top: 0; font-size: 20px; font-weight: 600; }
            .content p { color: #a1a1aa; font-size: 15px; line-height: 1.6; margin-bottom: 28px; }
            .button { display: inline-block; background-color: #ae0d05; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(174, 13, 5, 0.4); }
            .notice { font-size: 13px; color: #71717a; margin-top: 32px; line-height: 1.5; }
            .footer { background-color: #0c0c0c; padding: 20px; text-align: center; font-size: 12px; color: #52525b; border-top: 1px solid #1f1f23; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KAIRÓS CENTRO AUTOMOTIVO</h1>
            </div>
            <div class="content">
              <h2>Recuperação de Senha</h2>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta na <strong>Kairós Centro Automotivo</strong>.<br/>Para criar uma nova senha com segurança, clique no botão abaixo:</p>
              
              <a href="${actionLink}" class="button">Redefinir Minha Senha</a>
              
              <p class="notice">Se você não solicitou a redefinição de senha, ignore este e-mail tranquilamente. O seu acesso continuará seguro.<br/>Este link é válido por 1 hora.</p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Kairós Centro Automotivo &bull; Todos os direitos reservados.
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`✅ [ForgotPassword] E-mail enviado para ${email}`);
    return res.json({ success: true, data: emailResult });
  } catch (err) {
    console.error('❌ [ForgotPassword] Erro interno:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
