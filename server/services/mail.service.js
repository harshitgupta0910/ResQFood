const nodemailer = require('nodemailer');

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
  const resendApiKey = String(process.env.RESEND_API_KEY || '').trim();
  const smtpFrom = process.env.EMAIL_FROM || `${fromName} <${user}>`;
  const resendFrom = process.env.MAIL_FROM || process.env.EMAIL_FROM || `${fromName} <onboarding@resend.dev>`;
  const recipients = Array.isArray(to) ? to : [to];
  let lastSendError = null;

  if (smtp && user) {
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
      lastSendError = smtpError;
      console.warn(`SMTP send failed, trying Resend fallback: ${smtpError.message}`);
    }
  }

  if (resendApiKey) {
    const response = await withTimeout(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: resendFrom,
          to: recipients,
          subject,
          html,
          text,
        }),
      }),
      15000,
      'Resend request timed out'
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend error ${response.status}: ${body}`);
    }

    const payload = await response.json();
    return { id: payload.id, accepted: recipients, rejected: [], provider: 'resend' };
  }

  if (lastSendError) {
    throw new Error(`Email delivery failed: ${lastSendError.message}`);
  }

  throw new Error('Email service is not configured: set SMTP credentials or RESEND_API_KEY');
};

module.exports = { sendMail };
