const nodemailer = require('nodemailer');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

const SMTP_ATTEMPT_TIMEOUT_MS = Number(process.env.SMTP_ATTEMPT_TIMEOUT_MS || 5000);

const withTimeout = (promise, timeoutMs, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);

const createTransporter = (host, port, user, pass) => {
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    family: 4,
    connectionTimeout: SMTP_ATTEMPT_TIMEOUT_MS,
    greetingTimeout: SMTP_ATTEMPT_TIMEOUT_MS,
    socketTimeout: SMTP_ATTEMPT_TIMEOUT_MS,
    auth: {
      user,
      pass,
    },
  });
};

const getPortCandidates = () => {
  const host = process.env.EMAIL_HOST;
  const configuredPort = Number(process.env.EMAIL_PORT || 587);
  const fallbackPorts = String(process.env.EMAIL_FALLBACK_PORTS || '465')
    .split(',')
    .map((value) => Number(String(value).trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
  const user = process.env.EMAIL_USER;
  const pass = String(process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  return {
    host,
    user,
    pass,
    ports: [configuredPort, ...fallbackPorts.filter((port) => port !== configuredPort)],
  };
};

const sendMail = async ({ to, subject, html, text }) => {
  const config = getPortCandidates();
  const user = process.env.EMAIL_USER;
  const fromName = process.env.EMAIL_FROM_NAME || 'ResQFood';
  const shouldTrySmtp = Boolean(config.host && config.user && config.pass && user);
  const smtpFrom = process.env.EMAIL_FROM || `${fromName} <${user}>`;
  const recipients = Array.isArray(to) ? to : [to];

  if (shouldTrySmtp) {
    let lastError = null;
    const attemptErrors = [];

    for (const port of config.ports) {
      const smtp = createTransporter(config.host, port, config.user, config.pass);
      try {
        const info = await withTimeout(
          smtp.sendMail({
            from: smtpFrom,
            to: recipients.join(','),
            subject,
            html,
            text,
          }),
          SMTP_ATTEMPT_TIMEOUT_MS,
          `SMTP request timed out on port ${port}`
        );

        const accepted = Array.isArray(info.accepted) ? info.accepted : [];
        if (!accepted.length) {
          throw new Error(`SMTP did not accept any recipients. Rejected: ${(info.rejected || []).join(', ') || 'unknown'}`);
        }

        return {
          id: info.messageId,
          accepted,
          rejected: info.rejected,
          provider: 'smtp',
          port,
        };
      } catch (smtpError) {
        lastError = smtpError;
        attemptErrors.push(`${port}:${smtpError.message}`);
        console.warn(`SMTP send failed on ${config.host}:${port} - ${smtpError.message}`);
      }
    }

    throw new Error(
      `Email delivery failed: ${lastError ? lastError.message : 'Unknown SMTP error'}. Attempts: ${attemptErrors.join(' | ')}`
    );
  }

  throw new Error('Email service is not configured: set SMTP credentials');
};

module.exports = { sendMail };
