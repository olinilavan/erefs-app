const PERSONAL_DOMAINS = new Set([
  'gmail.com','yahoo.com','hotmail.com','outlook.com','live.com',
  'icloud.com','aol.com','mail.com','protonmail.com','ymail.com',
  'msn.com','me.com','mac.com','googlemail.com','yahoo.co.uk',
]);

export function isPersonalEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? PERSONAL_DOMAINS.has(domain) : false;
}
