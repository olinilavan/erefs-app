const nodemailer = require('nodemailer');

const isDev = !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_sendgrid_api_key';

const transporter = isDev
  ? null
  : nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

async function sendReferrerInvite(referrer, referralRequest, requester) {
  const formUrl = `${process.env.FRONTEND_URL}/ref/${referrer.token}`;
  const candidateName = referralRequest.candidate_name || requester.name;

  if (isDev) {
    console.log(`\n[DEV] Referrer invite for ${referrer.name} <${referrer.email}>`);
    console.log(`[DEV] Form URL: ${formUrl}\n`);
    return;
  }

  await transporter.sendMail({
    from: `"eRefs.ai" <${process.env.EMAIL_FROM}>`,
    to: referrer.email,
    subject: `Reference Request for ${candidateName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">You've been asked to provide a reference</h2>
        <p>Hi ${referrer.name},</p>
        <p><strong>${requester.name}</strong> has requested a professional reference from you via <strong>eRefs.ai</strong>.</p>
        ${referralRequest.target_role ? `<p>This reference is for a <strong>${referralRequest.target_role}</strong> role.</p>` : ''}
        <p>It takes about 5–10 minutes to complete 10 short questions.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${formUrl}" style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Complete Reference Form
          </a>
        </p>
        <p style="color: #888; font-size: 12px;">This link expires in 30 days. If you did not expect this email, you can safely ignore it.</p>
      </div>
    `,
  });
}

module.exports = { sendReferrerInvite };
