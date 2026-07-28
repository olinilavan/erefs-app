const express = require('express');
const cors = require('cors');

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

app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
