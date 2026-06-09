const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const referralRoutes = require('./routes/referrals');
const referrerRoutes = require('./routes/referrers');
const reportRoutes = require('./routes/reports');
const employerRoutes = require('./routes/employer');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/referrers', referrerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/employer', employerRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`eRefs API running on port ${PORT}`));
