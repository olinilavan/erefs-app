// Structured logger — outputs JSON lines Railway/any log aggregator can parse.
// Usage: log.info('job.created', { jobId, employerId, title })
//        log.error('bgcheck.failed', { error: err.message, userId })
//
// Set LOG_LEVEL env var to control verbosity:
//   debug → all output (local dev)
//   info  → info + warn + error (default)
//   warn  → warn + error (staging)
//   error → errors only (production)

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const configured = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function write(level, event, data = {}) {
  if (LEVELS[level] < configured) return;
  console.log(JSON.stringify({
    ts:    new Date().toISOString(),
    level,
    event,
    ...data,
  }));
}

const log = {
  debug: (event, data) => write('debug', event, data),
  info:  (event, data) => write('info',  event, data),
  warn:  (event, data) => write('warn',  event, data),
  error: (event, data) => write('error', event, data),
};

module.exports = log;
