const nodemailer = require('nodemailer');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

let transporter;

const withTimeout = (promise, timeoutMs, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = String(process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const smtp = getTransporter();
  const user = process.env.EMAIL_USER;
  const fromName = process.env.EMAIL_FROM_NAME || 'ResQFood';
  const shouldTrySmtp = Boolean(smtp && user);
  const smtpFrom = process.env.EMAIL_FROM || `${fromName} <${user}>`;
  const recipients = Array.isArray(to) ? to : [to];

  if (shouldTrySmtp) {
    try {
      const info = await withTimeout(
        smtp.sendMail({
          from: smtpFrom,
          to: recipients.join(','),
          subject,
          html,
          text,
        }),
        15000,
        'SMTP request timed out'
      );

      const accepted = Array.isArray(info.accepted) ? info.accepted : [];
      if (!accepted.length) {
        throw new Error(`SMTP did not accept any recipients. Rejected: ${(info.rejected || []).join(', ') || 'unknown'}`);
      }

      return { id: info.messageId, accepted, rejected: info.rejected, provider: 'smtp' };
    } catch (smtpError) {
      console.warn(`SMTP send failed: ${smtpError.message}`);
      throw new Error(`Email delivery failed: ${smtpError.message}`);
    }
  }

  throw new Error('Email service is not configured: set SMTP credentials');
};

module.exports = { sendMail };
