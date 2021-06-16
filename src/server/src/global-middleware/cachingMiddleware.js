/*
 Module responsible for caching, revoking and blacklisting the tokens and
 read responses.
*/

/* eslint-disable no-unused-expressions */

const client = require('redis').createClient();

const { enums, cacheKeyGenerator } = include('server/src/helpers');
const logger = include('server/src/helpers/logger')(__filename);

const { TOKEN_TYPES } = enums;
client.on('connect', () => logger.info('Redis connected'));

const cachingMiddleware = {
  async isActiveToken(email) {
    const accessToken = await this.getAccessToken(email);
    const refreshToken = await this.getRefreshToken(email);

    if (!accessToken || !refreshToken) { return null; }
    return { accessToken, refreshToken };
  },
  async cacheTokenAsync(email, token, type, hasTTL) {
    const key = type + email;
    await new Promise((resolve, reject) => {
      if (hasTTL) {
        client.set(key, token, 'EX', process.env.ACCESS_TOKEN_EXPIRY_INTEGER, (err) => {
          if (err) reject(err);
        });
      } else {
        client.set(key, token, (err) => {
          if (err) reject(err);
        });
      }
      resolve();
    });
  },
  async isRefreshTokenValid(email, refreshToken) {
    const cachedToken = await new Promise((resolve) => {
      client.get(TOKEN_TYPES.REFRESH_TOKEN + email, (err, token) => {
        if (err) { resolve(); } else { resolve(token); }
      });
    });
    return cachedToken === refreshToken;
  },
  async getRefreshToken(email) {
    const refreshToken = await new Promise((resolve) => {
      client.get(TOKEN_TYPES.REFRESH_TOKEN + email, (err, token) => {
        if (err) { resolve(); } else { resolve(token); }
      });
    });
    return refreshToken;
  },
  async getAccessToken(email) {
    const accessToken = await new Promise((resolve) => {
      client.get(TOKEN_TYPES.ACCESS_TOKEN + email, (err, token) => {
        if (err) { resolve(); } else { resolve(token); }
      });
    });
    return accessToken;
  },
  getCachedResponse(req, res, next) {
    const key = cacheKeyGenerator.generateKey(req.baseUrl, req.user.email);
    logger.info(key, req.user.email);
    if (key) {
      client.get(key, (err, result) => {
        if (err == null && result != null) {
          logger.info('sending cached response');
          res.send(JSON.parse(result));
        } else {
          res.sendResponse = res.send;
          res.send = (body, cache) => {
            if (cache) {
              client.set(key, JSON.stringify(body), 'EX', process.env.ACCESS_TOKEN_EXPIRY_INTEGER, (error) => {
                if (error) logger.error('Failed to cache', error);
                res.sendResponse(body);
              });
            } else {
              res.sendResponse(body);
            }
          };
          next();
        }
      });
    }
  },
  revokeAllTokens(email) {
    client.del(TOKEN_TYPES.ACCESS_TOKEN + email);
    client.del(TOKEN_TYPES.REFRESH_TOKEN + email);
  },
  revokeAccessToken(email) {
    client.del(TOKEN_TYPES.ACCESS_TOKEN + email);
  },
  revokeCachedResponses(url, email) {
    const key = cacheKeyGenerator.generateKey(url, email);
    client.del(key);
  },
  addTokenToBlackList({ token, expiryTime, email }) {
    // B for blacklisted
    try {
      // logger.info(`Blacklisted user details ${token},${expiryTime},${email}`);
      client.set(TOKEN_TYPES.BLACK_LIST_TOKEN + token, 'B', (err) => {
        if (err) logger.error(`Failed to blacklist token for user ${email}`);
        else logger.info(`Blacklisted the token for user ${email}`);
      });
      client.expireat(TOKEN_TYPES.BLACK_LIST_TOKEN + token, expiryTime, (err) => {
        if (err) { logger.error(err); }
      });
    } catch (err) {
      logger.error(err);
    }
  },
  async isTokenBlackListed(token) {
    let isBlacklisted = false;
    try {
      isBlacklisted = await new Promise((resolve) => {
        client.get(TOKEN_TYPES.BLACK_LIST_TOKEN + token, (err, value) => {
          if (err) {
            resolve(false);
            logger.error('Unable to check now ', err);
          } else {
            value === 'B' ? resolve(true) : resolve(false);
          }
        });
      });
    } catch (err) {
      logger.error(err);
    }
    logger.info(`is token blacklisted:${isBlacklisted}`);
    return isBlacklisted;
  },
};

module.exports = cachingMiddleware;
