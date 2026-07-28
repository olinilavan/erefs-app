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

async function sendVendorLinkRequest(buyer, vendor) {
  console.log(`\n[DEV] Vendor link request: ${vendor.company || vendor.name} → ${buyer.company || buyer.name}\n`);
  if (isDev) return;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: buyer.email,
    subject: `${vendor.company || vendor.name} wants to become your vendor`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">New vendor request</h2>
        <p><strong>${vendor.company || vendor.name}</strong> (${vendor.email}) has requested to become an approved vendor on your job postings.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${BASE_URL}/employer/vendor-network" style="background: #0f766e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Review Request
          </a>
        </p>
      </div>
    `,
  });

  if (error) console.error('[vendor link request email failed]', error);
  else console.log('[vendor link request email sent]', data?.id, '→', buyer.email);
}

async function sendVendorLinkApproved(buyer, vendor) {
  console.log(`\n[DEV] Vendor link approved: ${vendor.company || vendor.name} ↔ ${buyer.company || buyer.name}\n`);
  if (isDev) return;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: vendor.email,
    subject: `You're now an approved vendor for ${buyer.company || buyer.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f766e;">Vendor request approved</h2>
        <p>You're now an approved vendor for <strong>${buyer.company || buyer.name}</strong> — you can view their job postings and submit candidates.</p>
      </div>
    `,
  });

  if (error) console.error('[vendor link approved email failed]', error);
  else console.log('[vendor link approved email sent]', data?.id, '→', vendor.email);
}

async function sendVendorLinkDeclined(buyer, vendor) {
  console.log(`\n[DEV] Vendor link declined: ${vendor.company || vendor.name} ✗ ${buyer.company || buyer.name}\n`);
  if (isDev) return;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: vendor.email,
    subject: `Your vendor request was not approved`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Vendor request declined</h2>
        <p>Your request to become a vendor for <strong>${buyer.company || buyer.name}</strong> was not approved.</p>
      </div>
    `,
  });

  if (error) console.error('[vendor link declined email failed]', error);
  else console.log('[vendor link declined email sent]', data?.id, '→', vendor.email);
}

async function sendVendorLinkRevoked(recipient, otherParty) {
  console.log(`\n[DEV] Vendor link revoked for ${recipient.name} (↔ ${otherParty.company || otherParty.name})\n`);
  if (isDev) return;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: recipient.email,
    subject: `Your vendor link with ${otherParty.company || otherParty.name} was removed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Vendor link removed</h2>
        <p>Your vendor link with <strong>${otherParty.company || otherParty.name}</strong> has been revoked.</p>
      </div>
    `,
  });

  if (error) console.error('[vendor link revoked email failed]', error);
  else console.log('[vendor link revoked email sent]', data?.id, '→', recipient.email);
}

async function sendVendorSubmissionNotification(buyer, vendor, job, candidateName) {
  console.log(`\n[DEV] Vendor submission: ${vendor.company || vendor.name} submitted ${candidateName} for "${job.title}"\n`);
  if (isDev) return;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: buyer.email,
    subject: `New vendor submission for "${job.title}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">New candidate submitted</h2>
        <p><strong>${vendor.company || vendor.name}</strong> submitted <strong>${candidateName}</strong> for your posting "${job.title}".</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${BASE_URL}/employer/jobs/${job.id}/applicants" style="background: #0f766e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Review Submission
          </a>
        </p>
      </div>
    `,
  });

  if (error) console.error('[vendor submission email failed]', error);
  else console.log('[vendor submission email sent]', data?.id, '→', buyer.email);
}

async function sendBgCheckInvite(candidate, employer, token, checks, deadlineDays) {
  const checkList = [
    checks.reference && 'Reference Check',
    checks.education && 'Education Verification',
    checks.criminal  && 'Criminal Background Check',
  ].filter(Boolean).join(', ');
  const link = `${BASE_URL}/bg/${token}`;
  console.log(`\n[DEV] BG check invite → ${candidate.email}\nChecks: ${checkList}\nLink: ${link}\n`);
  if (isDev) return;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: candidate.email,
    subject: `Background check request from ${employer.company || employer.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Background check requested</h2>
        <p>Hi ${candidate.name},</p>
        <p><strong>${employer.company || employer.name}</strong> has requested a background check as part of your application for <strong>${candidate.role || 'a role'}</strong>.</p>
        <p>Checks requested: <strong>${checkList}</strong></p>
        <p>Please complete this within <strong>${deadlineDays} days</strong>.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background: #0f766e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Complete Background Check
          </a>
        </p>
      </div>
    `,
  });

  if (error) console.error('[bg check invite failed]', error);
  else console.log('[bg check invite sent]', data?.id, '→', candidate.email);
}

async function sendBgCheckSubmitted(employer, candidate) {
  console.log(`\n[DEV] BG check submitted by ${candidate.email} → notify ${employer.email}\n`);
  if (isDev) return;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: employer.email,
    subject: `${candidate.name} completed their background check`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Background check submitted</h2>
        <p><strong>${candidate.name}</strong> has submitted their background check information for <strong>${candidate.role || 'the role'}</strong>.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${BASE_URL}/employer/bg-checks/${candidate.checkId}" style="background: #0f766e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            View Background Check
          </a>
        </p>
      </div>
    `,
  });

  if (error) console.error('[bg check submitted email failed]', error);
  else console.log('[bg check submitted email sent]', data?.id, '→', employer.email);
}

async function sendBgCheckDeclined(employer, candidate) {
  console.log(`\n[DEV] BG check declined by ${candidate.email} → notify ${employer.email}\n`);
  if (isDev) return;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: employer.email,
    subject: `${candidate.name} declined the background check`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Background check declined</h2>
        <p><strong>${candidate.name}</strong> has declined to complete the background check for <strong>${candidate.role || 'the role'}</strong>.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${BASE_URL}/employer/bg-checks/${candidate.checkId}" style="background: #0f766e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            View Details
          </a>
        </p>
      </div>
    `,
  });

  if (error) console.error('[bg check declined email failed]', error);
  else console.log('[bg check declined email sent]', data?.id, '→', employer.email);
}

async function sendBenchReport(employer, resources, days) {
  const onBench     = resources.filter(r => r.computed_status === 'bench');
  const endingSoon  = resources.filter(r => r.computed_status === 'ending_soon');
  const total       = onBench.length + endingSoon.length;
  const reportDate  = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const resourceRow = r => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0;">
        <strong style="color: #1a1a2e;">${r.name}</strong>
        ${r.job_title ? `<br><span style="font-size: 12px; color: #777;">${r.job_title}</span>` : ''}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #555;">
        ${r.skills ? r.skills.split(',').slice(0, 4).map(s => s.trim()).join(', ') : '—'}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #555;">${r.location || '—'}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #555;">
        ${r.placement ? r.placement.clientName : '—'}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">
        ${r.placement?.endDate
          ? `<span style="color: #d97706; font-weight: 600;">${new Date(r.placement.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>`
          : '<span style="color: #0f766e; font-weight: 600;">Available now</span>'}
      </td>
    </tr>`;

  const tableHeader = `
    <tr style="background: #f9fafb;">
      <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Resource</th>
      <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Skills</th>
      <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Location</th>
      <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Current Client</th>
      <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Availability</th>
    </tr>`;

  if (isDev) {
    console.log(`\n[DEV] Bench report for ${employer.company || employer.name}`);
    console.log(`[DEV] ${onBench.length} on bench, ${endingSoon.length} ending within ${days} days\n`);
    return;
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: employer.email,
    subject: `Workforce Bench Report — ${total} resource${total !== 1 ? 's' : ''} available within ${days} days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #0f766e; padding: 24px 32px;">
          <h1 style="color: white; margin: 0; font-size: 22px;">Workforce Bench Report</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">
            ${employer.company || employer.name} · ${reportDate} · Next ${days} days
          </p>
        </div>

        <div style="padding: 24px 32px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
          <span style="display: inline-block; background: #dcfce7; color: #15803d; font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 99px; margin-right: 8px;">
            ${onBench.length} on bench
          </span>
          <span style="display: inline-block; background: #fef3c7; color: #b45309; font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 99px;">
            ${endingSoon.length} ending soon
          </span>
        </div>

        ${onBench.length > 0 ? `
        <div style="padding: 24px 32px 0;">
          <h2 style="font-size: 16px; margin: 0 0 12px; color: #15803d;">Available Now — On Bench</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            ${tableHeader}${onBench.map(resourceRow).join('')}
          </table>
        </div>` : ''}

        ${endingSoon.length > 0 ? `
        <div style="padding: 24px 32px 0;">
          <h2 style="font-size: 16px; margin: 0 0 12px; color: #b45309;">Ending Soon — Within ${days} Days</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            ${tableHeader}${endingSoon.map(resourceRow).join('')}
          </table>
        </div>` : ''}

        <div style="padding: 24px 32px; text-align: center;">
          <a href="${BASE_URL}/employer/workforce?tab=bench" style="background: #0f766e; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
            View Full Bench Report →
          </a>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; padding: 0 32px 24px;">
          Sent from VouchMetrics Workforce · <a href="${BASE_URL}/employer/workforce" style="color: #9ca3af;">Manage your workforce</a>
        </p>
      </div>
    `,
  });

  if (error) console.error('[bench report email failed]', error);
  else console.log('[bench report email sent]', data?.id, '→', employer.email);
}

module.exports = { sendReferrerInvite, sendPasswordReset, sendVerificationEmail, sendReminderEmail, sendCandidateProfileInvite, sendEmployerContactRequest, sendNewApplicantNotification, sendAdminReminderReport, sendVendorLinkRequest, sendVendorLinkApproved, sendVendorLinkDeclined, sendVendorLinkRevoked, sendVendorSubmissionNotification, sendBgCheckInvite, sendBgCheckSubmitted, sendBgCheckDeclined, sendBenchReport };
