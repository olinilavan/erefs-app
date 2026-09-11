const db = require('../db');

async function getCompanyMemberIds(userId) {
  const { rows } = await db.query('SELECT company_id FROM users WHERE id = $1', [userId]);
  const companyId = rows[0]?.company_id;
  if (!companyId) return [userId];
  const members = await db.query('SELECT id FROM users WHERE company_id = $1', [companyId]);
  return members.rows.map(r => r.id);
}

async function getUserCompanyId(userId) {
  const { rows } = await db.query('SELECT company_id FROM users WHERE id = $1', [userId]);
  return rows[0]?.company_id || null;
}

async function logActivity(client, { companyId, actorId, targetUserId, action, entityType, entityId, entityName, note }) {
  try {
    const q = client.query ? client : db;
    await q.query(
      `INSERT INTO activity_log (company_id, actor_id, target_user_id, action, entity_type, entity_id, entity_name, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [companyId || null, actorId, targetUserId || null, action, entityType, entityId || null, entityName || null, note || null]
    );
  } catch (err) {
    console.error('[activity_log] failed:', err.message);
  }
}

module.exports = { getCompanyMemberIds, getUserCompanyId, logActivity };
