const jwt = require('jsonwebtoken');

// Identifies the user if a valid token is present, but never blocks the request.
// For routes that are public but behave differently when the caller is logged in
// (e.g. showing "already applied" state).
module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Invalid/expired token on a public route — just proceed as anonymous.
    }
  }
  next();
};
