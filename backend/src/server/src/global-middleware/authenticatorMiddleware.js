/* eslint-disable consistent-return */
/*
 Module which authenticates every request coming in to access the rest endpoints
 using the AccessToken in the authorization header
*/

const jwt = require('jsonwebtoken');

const { enums, error } = include('server/src/helpers');
const cachingMiddleware = include('server/src/global-middleware/cachingMiddleware');
const { userService } = include('server/src/modules/user/services');

const { ErrorHandler } = error;
const { HTTP_STATUS_CODES } = enums;

const authenticatorMiddleware = {
  async authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null || await cachingMiddleware.isTokenBlackListed(token)) {
      return res.status(401).send('Missing or Invalid token');
    }

    jwt.verify(token, process.env.TOKEN_SECRET, async (err, userFromToken) => {
      try {
        if (err) throw new ErrorHandler(HTTP_STATUS_CODES.UNAUTHORIZED_401, 'Token expired OR Invalid token provided');
        if (req.url === '/logoff' || (req.method === 'PATCH' && req.baseUrl === '/user')) {
          req.tokenExpireTime = userFromToken.exp;
        }
        const user = await userService.findUserByEmailId(userFromToken.username);
        if (user === null) throw new ErrorHandler(HTTP_STATUS_CODES.NOT_FOUND_404, 'User not found');
        req.user = user;
        next();
      } catch (e) {
        next(e);
      }
    });
  },
};

module.exports = authenticatorMiddleware;
