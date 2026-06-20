const { Resend } = require('resend');

const isDev = !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key';
const resend = isDev ? null : new Resend(process.env.RESEND_API_KEY);

const BASE_URL = (process.env.FRONTEND_URL || '').split(',')[0].trim();

async function sendReferrerInvite(referrer, referralRequest, requester, reminderDays = 0) {
  const formUrl = `${BASE_URL}/ref/${referrer.token}`;
  const declineUrl = `${formUrl}?action=decline`;
  const callUrl = `${formUrl}?action=call`;
  const candidateName = referralRequest.candidate_name || requester.name;
  const reminderNote = reminderDays > 0
    ? `<p style="color: #555; font-size: 13px;">If you haven't responded, you'll receive a reminder in <strong>${reminderDays} days</strong>.</p>`
    : '';

  if (isDev) {
    console.log(`\n[DEV] Referrer invite for ${referrer.name} <${referrer.email}>`);
    console.log(`[DEV] Form URL: ${formUrl}`);
    console.log(`[DEV] Decline URL: ${declineUrl}`);
    console.log(`[DEV] Call URL: ${callUrl}\n`);
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
        <p><strong>${requester.name}</strong> has requested a professional reference from you via <strong>VouchMetrics</strong>.</p>
        ${referralRequest.target_role ? `<p>This reference is for a <strong>${referralRequest.target_role}</strong> role.</p>` : ''}
        <p>It takes about 5–10 minutes to complete 10 short questions.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${formUrl}" style="background: #0f766e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Complete Reference Form
          </a>
        </p>
        <p style="text-align: center; color: #555; font-size: 13px; margin-top: 8px;">
          Not able to help?
          <a href="${declineUrl}" style="color: #dc2626; text-decoration: underline;">Decline</a>
          &nbsp;·&nbsp;
          <a href="${callUrl}" style="color: #7c3aed; text-decoration: underline;">Request a Call Instead</a>
        </p>
        ${reminderNote}
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
  const resetUrl = `${BASE_URL}/reset-password/${token}`;

  console.log(`\n[Reset URL] ${resetUrl}\n`);

  if (isDev) {
    return;
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: email,
    subject: 'Reset your VouchMetrics password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Reset your password</h2>
        <p>We received a request to reset your VouchMetrics password. Click the button below to choose a new one.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #0f766e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
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

async function sendVerificationEmail(email, token) {
  const verifyUrl = `${BASE_URL}/verify-email/${token}`;

  console.log(`\n[Verification URL] ${verifyUrl}\n`);

  if (isDev) return;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: email,
    subject: 'Verify your VouchMetrics account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f766e;">Verify your email address</h2>
        <p>Thanks for signing up for VouchMetrics. Click the button below to verify your email and activate your account.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="background: #0f766e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Verify Email Address
          </a>
        </p>
        <p style="color: #888; font-size: 12px;">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error('[verification email failed]', error);
    throw new Error(error.message);
  }
  console.log('[verification email sent]', data?.id, '→', email);
}

async function sendReminderEmail(referrer, requesterName, targetRole) {
  const formUrl = `${BASE_URL}/ref/${referrer.token}`;
  const declineUrl = `${formUrl}?action=decline`;
  const callUrl = `${formUrl}?action=call`;

  console.log(`\n[Reminder URL] ${formUrl} → ${referrer.email}`);
  console.log(`[Reminder Decline URL] ${declineUrl}`);
  console.log(`[Reminder Call URL] ${callUrl}\n`);

  if (isDev) return;

  const roleText = targetRole ? ` for a <strong>${targetRole}</strong> role` : '';

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: referrer.email,
    subject: `Reminder: Reference request from ${requesterName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Friendly reminder — reference request pending</h2>
        <p>Hi ${referrer.name},</p>
        <p>Just a reminder that <strong>${requesterName}</strong> is still waiting for your reference${roleText}.</p>
        <p>It only takes about 5–10 minutes to complete.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${formUrl}" style="background: #0f766e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Complete Reference Form
          </a>
        </p>
        <p style="text-align: center; color: #555; font-size: 13px; margin-top: 8px;">
          Not able to help?
          <a href="${declineUrl}" style="color: #dc2626; text-decoration: underline;">Decline</a>
          &nbsp;·&nbsp;
          <a href="${callUrl}" style="color: #7c3aed; text-decoration: underline;">Request a Call Instead</a>
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">If you've already completed this, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error('[reminder email failed]', error);
    throw new Error(error.message);
  }
  console.log('[reminder email sent]', data?.id, '→', referrer.email);
}

module.exports = { sendReferrerInvite, sendPasswordReset, sendVerificationEmail, sendReminderEmail };
