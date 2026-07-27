const nodemailer = require('nodemailer');

let transporter;

if (process.env.NODE_ENV === 'test') {
  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'windows'
  });
} else {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
}

const sendMail = async (to, subject, text, html) => {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'EduTrack'}" <${process.env.SMTP_FROM_EMAIL || 'noreply@edutrack.local'}>`,
    to,
    subject,
    text,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (process.env.NODE_ENV === 'test') {
      // In test mode, we store the message string on the info object so tests can parse the OTP
      info.messageString = info.message.toString();
    }
    return info;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    throw new Error('Failed to send email');
  }
};

module.exports = { sendMail, transporter };
