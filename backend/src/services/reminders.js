const cron = require('node-cron');
const db = require('../db');
const { sendReminderEmail, sendAdminReminderReport, sendBenchReport } = require('./email');

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

// ── Weekly bench report ───────────────────────────────────────────────────────

function computedStatus(resource, activePlacement) {
  if (resource.status === 'on_leave' || resource.status === 'inactive') return resource.status;
  if (!activePlacement) return 'bench';
  if (!activePlacement.end_date) return 'placed';
  const days = Math.ceil((new Date(activePlacement.end_date) - new Date()) / 86400000);
  if (days < 0)  return 'bench';
  if (days <= 30) return 'ending_soon';
  return 'placed';
}

function enrichBenchRow(r) {
  const placement = r.placement_id
    ? { id: r.placement_id, clientName: r.client_name, projectName: r.project_name,
        startDate: r.placement_start, endDate: r.placement_end,
        billRate: r.bill_rate, payRate: r.pay_rate, rateType: r.rate_type,
        notes: r.placement_notes }
    : null;
  const { placement_id, client_name, project_name, placement_start, placement_end,
          bill_rate, pay_rate, rate_type, placement_notes, ...resource } = r;
  return { ...resource, computed_status: computedStatus(resource, placement), placement };
}

async function sendWeeklyBenchReports() {
  console.log('[bench-report] sending weekly bench reports…');
  try {
    const employers = await db.query(
      `SELECT id, name, email, company FROM users
       WHERE role = 'employer' AND bench_report_enabled = true`
    );
    console.log(`[bench-report] ${employers.rows.length} employer(s) opted in`);

    for (const employer of employers.rows) {
      try {
        const result = await db.query(`
          SELECT r.*,
            p.id AS placement_id,
            p.client_name, p.project_name,
            p.start_date AS placement_start,
            p.end_date   AS placement_end,
            p.bill_rate, p.pay_rate, p.rate_type,
            p.notes AS placement_notes
          FROM workforce_resources r
          LEFT JOIN workforce_placements p ON p.resource_id = r.id AND p.status = 'active'
          WHERE r.employer_id = $1
            AND r.status NOT IN ('inactive')
            AND (
              p.id IS NULL
              OR p.end_date < CURRENT_DATE
              OR p.end_date <= CURRENT_DATE + (30 * INTERVAL '1 day')
            )
          ORDER BY p.end_date ASC NULLS FIRST, r.name ASC
        `, [employer.id]);

        const resources = result.rows.map(enrichBenchRow);
        if (resources.length === 0) continue;

        await sendBenchReport(employer, resources, 30);
        console.log(`[bench-report] sent to ${employer.email}`);
      } catch (err) {
        console.error(`[bench-report] failed for ${employer.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[bench-report] query failed:', err.message);
  }
}

function startBenchReportCron() {
  cron.schedule('0 8 * * 1', sendWeeklyBenchReports);
  console.log('[bench-report] cron scheduled — weekly Mondays at 08:00');
}

module.exports = { startReminderCron, sendPendingReminders, startBenchReportCron, sendWeeklyBenchReports };
