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

async function sendCandidateProfileInvite(referralRequest) {
  const profileUrl = `${BASE_URL}/candidate/${referralRequest.candidate_token}`;
  const name = referralRequest.candidate_name || 'there';

  if (isDev) {
    console.log(`\n[DEV] Candidate profile invite for ${name} <${referralRequest.candidate_email}>`);
    console.log(`[DEV] Profile URL: ${profileUrl}\n`);
    return;
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: referralRequest.candidate_email,
    subject: 'Add your professional summary to your reference report',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Tell us about your professional background</h2>
        <p>Hi ${name},</p>
        <p>A reference report is being prepared for you on <strong>VouchMetrics</strong>. You can optionally add a short summary of your own experience, skills, and background — in your own words — to enrich your report with a Professional Profile section.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${profileUrl}" style="background: #0f766e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Add My Professional Summary
          </a>
        </p>
        <p style="color: #888; font-size: 12px;">This is entirely optional and only uses information you choose to share. This link expires in 30 days.</p>
      </div>
    `,
  });

  if (error) {
    console.error('[candidate profile invite failed]', error);
    throw new Error(error.message);
  }
  console.log('[candidate profile invite sent]', data?.id, '→', referralRequest.candidate_email);
}

async function sendEmployerContactRequest(jobseeker, employer, phone, message) {
  const adminCc = (process.env.ADMIN_REPORT_EMAILS || '')
    .split(',').map(e => e.trim()).filter(Boolean);

  if (isDev) {
    console.log(`\n[DEV] Employer contact request for ${jobseeker.name} <${jobseeker.email}>`);
    console.log(`[DEV] From: ${employer.name} <${employer.email}> ${phone}`);
    if (message) console.log(`[DEV] Message: ${message}`);
    if (adminCc.length) console.log(`[DEV] CC: ${adminCc.join(', ')}`);
    console.log('');
    return;
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: jobseeker.email,
    cc: adminCc.length ? adminCc : undefined,
    subject: `${employer.name} would like to connect with you on VouchMetrics`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">An employer is interested in connecting</h2>
        <p>Hi ${jobseeker.name},</p>
        <p>You opted in to be discoverable on VouchMetrics, and <strong>${employer.name}</strong>${employer.company ? ` from <strong>${employer.company}</strong>` : ''} would like to get in touch.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0; background: #f9fafb; border-radius: 8px;">
          <tr><td style="padding: 12px 16px; font-size: 14px; color: #555;">Name</td><td style="padding: 12px 16px; font-size: 14px; font-weight: bold;">${employer.name}</td></tr>
          <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 12px 16px; font-size: 14px; color: #555;">Email</td><td style="padding: 12px 16px; font-size: 14px; font-weight: bold;">${employer.email}</td></tr>
          <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 12px 16px; font-size: 14px; color: #555;">Phone</td><td style="padding: 12px 16px; font-size: 14px; font-weight: bold;">${phone}</td></tr>
        </table>
        ${message ? `<p style="background: #f0fdfa; border-radius: 8px; padding: 16px; color: #134e4a;">"${message}"</p>` : ''}
        <p style="color: #888; font-size: 12px; margin-top: 24px;">Your contact details were not shared with ${employer.name} — only theirs were shared with you. Reach out directly if you're interested. You can turn off employer contact anytime in your VouchMetrics settings.</p>
        <p style="color: #888; font-size: 12px;">The VouchMetrics team is copied on this email — reply-all if you have any questions, run into an issue with reaching this employer.</p>
      </div>
    `,
  });

  if (error) {
    console.error('[employer contact request email failed]', error);
    throw new Error(error.message);
  }
  console.log('[employer contact request sent]', data?.id, '→', jobseeker.email);
}

async function sendNewApplicantNotification(employer, applicant, job, message) {
  const adminCc = (process.env.ADMIN_REPORT_EMAILS || '')
    .split(',').map(e => e.trim()).filter(Boolean);

  if (isDev) {
    console.log(`\n[DEV] New applicant for "${job.title}" — ${applicant.name} <${applicant.email}>`);
    if (applicant.resume_url) console.log(`[DEV] Resume: ${applicant.resume_url}`);
    if (message) console.log(`[DEV] Message: ${message}`);
    if (adminCc.length) console.log(`[DEV] CC: ${adminCc.join(', ')}`);
    console.log('');
    return;
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: employer.email,
    cc: adminCc.length ? adminCc : undefined,
    subject: `New applicant for ${job.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">You have a new applicant</h2>
        <p>Hi ${employer.name},</p>
        <p><strong>${applicant.name}</strong> applied to your posting for <strong>${job.title}</strong> on VouchMetrics.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0; background: #f9fafb; border-radius: 8px;">
          <tr><td style="padding: 12px 16px; font-size: 14px; color: #555;">Name</td><td style="padding: 12px 16px; font-size: 14px; font-weight: bold;">${applicant.name}</td></tr>
          <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 12px 16px; font-size: 14px; color: #555;">Email</td><td style="padding: 12px 16px; font-size: 14px; font-weight: bold;">${applicant.email}</td></tr>
          ${applicant.resume_url ? `<tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 12px 16px; font-size: 14px; color: #555;">Resume</td><td style="padding: 12px 16px; font-size: 14px;"><a href="${applicant.resume_url}" style="color: #0f766e;">View Resume</a></td></tr>` : ''}
        </table>
        ${message ? `<p style="background: #f0fdfa; border-radius: 8px; padding: 16px; color: #134e4a;">"${message}"</p>` : ''}
        <p style="text-align: center; margin: 32px 0;">
          <a href="${BASE_URL}/employer/jobs" style="background: #0f766e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            View All Applicants
          </a>
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[new applicant notification failed]', error);
    throw new Error(error.message);
  }
  console.log('[new applicant notification sent]', data?.id, '→', employer.email);
}

async function sendAdminReminderReport(stats) {
  const recipients = (process.env.ADMIN_REPORT_EMAILS || '')
    .split(',').map(e => e.trim()).filter(Boolean);

  console.log(`\n[reminders] Daily report — ${stats.date}`);
  console.log(`  Total: ${stats.total} | Employers: ${stats.employers} | Job Seekers: ${stats.jobSeekers} | Failures: ${stats.failures}`);

  if (!recipients.length || isDev) return;

  const breakdownHtml = stats.byRequester.length
    ? stats.byRequester.map(r => `
        <tr>
          <td style="padding: 6px 12px;">${r.displayName}</td>
          <td style="padding: 6px 12px; color: #555; text-transform: capitalize;">${r.role === 'employer' ? 'Employer' : 'Job Seeker'}</td>
          <td style="padding: 6px 12px; text-align: right;">${r.count}</td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="padding: 6px 12px; color: #888;">No reminders sent today</td></tr>`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: recipients,
    subject: `VouchMetrics — Daily Reminder Report — ${stats.date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Daily Reminder Report</h2>
        <p style="color: #555;">${stats.date}</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f9fafb; border-radius: 8px;">
          <tr>
            <td style="padding: 12px 16px; font-size: 14px; color: #555;">Total reminders sent</td>
            <td style="padding: 12px 16px; font-size: 22px; font-weight: bold; text-align: right;">${stats.total}</td>
          </tr>
          <tr style="border-top: 1px solid #e5e7eb;">
            <td style="padding: 12px 16px; font-size: 14px; color: #555;">Employers</td>
            <td style="padding: 12px 16px; font-size: 18px; font-weight: bold; text-align: right; color: #0f766e;">${stats.employers}</td>
          </tr>
          <tr style="border-top: 1px solid #e5e7eb;">
            <td style="padding: 12px 16px; font-size: 14px; color: #555;">Job Seekers</td>
            <td style="padding: 12px 16px; font-size: 18px; font-weight: bold; text-align: right; color: #0f766e;">${stats.jobSeekers}</td>
          </tr>
          <tr style="border-top: 1px solid #e5e7eb;">
            <td style="padding: 12px 16px; font-size: 14px; color: #555;">Failures</td>
            <td style="padding: 12px 16px; font-size: 18px; font-weight: bold; text-align: right; color: ${stats.failures > 0 ? '#dc2626' : '#16a34a'};">${stats.failures}</td>
          </tr>
        </table>

        <h3 style="color: #1a1a2e; margin-top: 24px;">Breakdown by Requester</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px 12px; text-align: left; color: #555;">Name</th>
              <th style="padding: 8px 12px; text-align: left; color: #555;">Role</th>
              <th style="padding: 8px 12px; text-align: right; color: #555;">Reminders</th>
            </tr>
          </thead>
          <tbody>
            ${breakdownHtml}
          </tbody>
        </table>

        <p style="color: #888; font-size: 12px; margin-top: 24px;">
          Sent automatically by VouchMetrics reminder cron — daily at 08:00.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[admin report email failed]', error);
  } else {
    console.log('[admin report sent]', data?.id, '→', recipients.join(', '));
  }
}

module.exports = { sendReferrerInvite, sendPasswordReset, sendVerificationEmail, sendReminderEmail, sendCandidateProfileInvite, sendEmployerContactRequest, sendNewApplicantNotification, sendAdminReminderReport };
