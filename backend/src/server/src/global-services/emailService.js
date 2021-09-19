/* eslint-disable default-case */
/**
 * Module responsible for sending emails to the user from admin
 * account to corresponding user for email verification and
 * forgot password.
 */

const nodeMailer = require('nodemailer');

const { HTTP_STATUS_CODES, EMAIL_TYPE } = include('server/src/helpers/enums');
const logger = include('server/src/helpers/logger')(__filename);
const { ErrorHandler } = include('server/src/helpers/error');

const transporter = nodeMailer.createTransport({
  service: process.env.MAIL_SERVER_NAME,
  port: process.env.MAIL_SERVER_PORT,
  secure: true, // true for 465, false for other ports
  logger: true,
  debug: true,
  secureConnection: true,
  auth: {
    user: process.env.EMAIL_SERVER_LOGIN, // generated ethereal user
    pass: process.env.EMAIL_SERVER_PASS, // generated ethereal password
  },
  tls: {
    rejectUnAuthorized: true,
  },
});

const mailOptions = (email, firstName, code, emailType) => {
  switch (emailType) {
    case EMAIL_TYPE.USER_REGISTRATION: return {
      to: email,
      subject: 'User registration @Examiner',
      text: `Hi ${firstName},\n\nPlease enter this OTP ${code} to complete the registration process. The OTP is valid for next 10 mins. \n\nThank You.`,
    };
    case EMAIL_TYPE.RESET_PASSWORD: return {
      to: email,
      subject: 'Reset Password @Examiner',
      text: `Hi ${firstName},\n\nPlease use this OTP ${code} to reset your password.  The OTP is valid for next 10 mins. \n\nThank You.`,
    };
  }
  return null;
};
const emailService = {
  sendEmail(email, firstName, code, emailType) {
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions(email, firstName, code, emailType))
        .then(() => {
          logger.info(`Sent verification email to ${email}`);
          resolve();
        })
        .catch((err) => {
          logger.error(err);
          reject(new ErrorHandler(HTTP_STATUS_CODES.SERVER_ERROR_500, 'Unable to verify email now, please try after sometime'));
        });
    });
  },
};

module.exports = emailService;
