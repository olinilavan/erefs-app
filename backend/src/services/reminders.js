const cron = require('node-cron');
const db = require('../db');
const { sendReminderEmail, sendAdminReminderReport } = require('./email');

async function sendPendingReminders() {
  console.log('[reminders] checking for overdue referrers…');
  try {
    const result = await db.query(`
      SELECT
        r.id, r.name, r.email, r.token,
        rr.target_role,
        u.id   AS requester_id,
        u.name AS requester_name,
        u.role AS requester_role,
        u.company AS requester_company
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

    const stats = {
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      total: 0,
      employers: 0,
      jobSeekers: 0,
      byRequester: {},
      failures: 0,
    };

    for (const row of result.rows) {
      try {
        await sendReminderEmail(row, row.requester_name, row.target_role);
        stats.total++;
        if (row.requester_role === 'employer') stats.employers++;
        else stats.jobSeekers++;

        if (!stats.byRequester[row.requester_id]) {
          stats.byRequester[row.requester_id] = {
            displayName: row.requester_role === 'employer'
              ? (row.requester_company || row.requester_name)
              : row.requester_name,
            role: row.requester_role,
            count: 0,
          };
        }
        stats.byRequester[row.requester_id].count++;
      } catch (err) {
        console.error(`[reminders] failed for ${row.email}:`, err.message);
        stats.failures++;
      }
    }

    stats.byRequester = Object.values(stats.byRequester)
      .sort((a, b) => b.count - a.count);

    await sendAdminReminderReport(stats);
  } catch (err) {
    console.error('[reminders] query failed:', err.message);
  }
}

function startReminderCron() {
  cron.schedule('0 8 * * *', sendPendingReminders);
  console.log('[reminders] cron scheduled — daily at 08:00');
}

module.exports = { startReminderCron, sendPendingReminders };
