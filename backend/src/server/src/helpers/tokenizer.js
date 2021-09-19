/**
 * Module responsible for creating access tokens and refresh tokens.
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('./logger')(__filename);

const tokenizer = {
  generateAccessToken(username) {
    return jwt.sign(
      { username },
      process.env.TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY_STRING },
    );
  },
  generateRefreshToken() {
    return crypto.randomBytes(40).toString('hex');
  },
  getParametersForBlacklistingAtoken(req) {
    logger.info('Getting parameters for blacklisting');
    const token = req.headers.authorization.split(' ')[1];
    const expiryTime = req.tokenExpireTime;
    const { email } = req.user;
    return { token, expiryTime, email };
  },
};

module.exports = tokenizer;
