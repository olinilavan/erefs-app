const cron = require('node-cron');
const db = require('../db');
const { sendReminderEmail } = require('./email');

async function sendPendingReminders() {
  console.log('[reminders] checking for overdue referrers…');
  try {
    // Find referrers who haven't submitted, whose invite crossed the reminder_days
    // threshold in the last 24 hours (so each referrer is reminded exactly once).
    const result = await db.query(`
      SELECT
        r.id, r.name, r.email, r.token,
        rr.target_role,
        u.name AS requester_name
      FROM referrers r
      JOIN referral_requests rr ON r.referral_request_id = rr.id
      JOIN users u ON rr.requester_id = u.id
      WHERE
        r.status IN ('invited', 'viewed')
        AND r.token_expires_at > NOW()
        AND rr.archived_at IS NULL
        AND u.reminder_days IS NOT NULL
        AND u.reminder_days > 0
        AND r.created_at <= NOW() - (u.reminder_days || ' days')::INTERVAL
        AND r.created_at >  NOW() - (u.reminder_days + 1 || ' days')::INTERVAL
    `);

    console.log(`[reminders] ${result.rows.length} reminder(s) to send`);

    for (const row of result.rows) {
      try {
        await sendReminderEmail(row, row.requester_name, row.target_role);
      } catch (err) {
        console.error(`[reminders] failed for ${row.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[reminders] query failed:', err.message);
  }
}

function startReminderCron() {
  // Runs every day at 8:00 AM server time
  cron.schedule('0 8 * * *', sendPendingReminders);
  console.log('[reminders] cron scheduled — daily at 08:00');
}

module.exports = { startReminderCron, sendPendingReminders };
