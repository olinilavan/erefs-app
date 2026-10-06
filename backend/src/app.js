const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const log = require('./utils/logger');

const authRoutes = require('./routes/auth');
const referralRoutes = require('./routes/referrals');
const referrerRoutes = require('./routes/referrers');
const candidateProfileRoutes = require('./routes/candidateProfile');
const reportRoutes = require('./routes/reports');
const employerRoutes = require('./routes/employer');
const talentRoutes = require('./routes/talent');
const jobsRoutes = require('./routes/jobs');
const settingsRoutes = require('./routes/settings');
const adminRoutes = require('./routes/admin');
const { employerRouter: bgCheckEmployerRoutes, publicRouter: bgCheckPublicRoutes } = require('./routes/bgChecks');
const workforceRoutes = require('./routes/workforce');
const companyRoutes = require('./routes/company');
const demoRoutes = require('./routes/demo');
const chatRoutes = require('./routes/chat');

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin === o || origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(morgan('combined'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/referrers', referrerRoutes);
app.use('/api/candidate-profile', candidateProfileRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/talent', talentRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employer', bgCheckEmployerRoutes);
app.use('/api/bg', bgCheckPublicRoutes);
app.use('/api/employer/workforce', workforceRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/chat', chatRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler — catches unhandled errors from any route
app.use((err, req, res, _next) => {
  log.error('unhandled_error', {
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
    userId: req.user?.id,
  });
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
