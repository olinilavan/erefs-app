const { Resend } = require('resend');

const isDev = !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key';
const resend = isDev ? null : new Resend(process.env.RESEND_API_KEY);

async function sendReferrerInvite(referrer, referralRequest, requester) {
  const formUrl = `${process.env.FRONTEND_URL}/ref/${referrer.token}`;
  const candidateName = referralRequest.candidate_name || requester.name;

  if (isDev) {
    console.log(`\n[DEV] Referrer invite for ${referrer.name} <${referrer.email}>`);
    console.log(`[DEV] Form URL: ${formUrl}\n`);
    return;
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
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

  if (error) {
    console.error('[email send failed]', error);
    throw new Error(error.message);
  }
  console.log('[email sent]', data?.id, '→', referrer.email);
}

async function sendPasswordReset(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  console.log(`\n[Reset URL] ${resetUrl}\n`);

  if (isDev) {
    return;
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: email,
    subject: 'Reset your eRefs.ai password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Reset your password</h2>
        <p>We received a request to reset your eRefs.ai password. Click the button below to choose a new one.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
        </p>
        <p style="color: #888; font-size: 12px;">This link expires in 30 minutes. If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error('[password reset email failed]', error);
    throw new Error(error.message);
  }
  console.log('[password reset email sent]', data?.id, '→', email);
}

module.exports = { sendReferrerInvite, sendPasswordReset };
