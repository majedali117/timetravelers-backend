const nodemailer = require('nodemailer');
const config = require('../config/config');

/**
 * Send email utility function
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.html - Email HTML content
 * @returns {Promise} - Nodemailer send mail promise
 */
const sendEmail = async (options) => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    auth: {
      user: config.email.smtp.auth.user,
      pass: config.email.smtp.auth.pass,
    },
  });

  // Define email options
  const mailOptions = {
    from: config.email.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  // Send email
  return await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
