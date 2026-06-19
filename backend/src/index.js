require('dotenv').config();
const app = require('./app');
const { startReminderCron } = require('./services/reminders');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`eRefs API running on port ${PORT}`);
  startReminderCron();
});
