/**
 * Module for handling all the rest endpoints defined in UserRoutes
 */

/* eslint-disable object-curly-newline */
/* eslint-disable no-underscore-dangle */
const { HTTP_STATUS_CODES } = include('server/src/helpers/enums');
const { tokenizer } = include('server/src/helpers');
const { userService } = include('server/src/modules/user/services');
const { getParametersForBlacklistingAtoken } = tokenizer;
const tokenCookieName = 'refreshToken';
const cookieCreateOptions = {
  // expiring the refresh token after 120 days
  // maxAge: 1000 * 60 * 60 * 24,
  maxAge: 1000 * 60 * 60 * 24 * 120,
  httpOnly: true,
  path: '/user/token',
  // TODO secure: true, uncomment this once https is enabled
  sameSite: true,
};

const cookieDestroyOptions = {
  maxAge: 0,
  httpOnly: true,
  path: '/user/token',
  // TODO secure: true, uncomment this once https is enabled
  sameSite: true,
};

const userController = {
  async register(req, res, next) {
    try {
      await userService.create(req.body, next);
      res.status(HTTP_STATUS_CODES.CREATED_201).send('User created');
    } catch (err) {
      next(err);
    }
  },
  async login(req, res, next) {
    try {
      const { accessToken, refreshToken } = await userService.login(req.body);
      res.cookie(tokenCookieName, refreshToken, cookieCreateOptions);
      res.send({ accessToken });
    } catch (err) {
      next(err);
    }
  },
  async read(req, res, next) {
    try {
      const user = await userService.read(req.user);
      res.send(user, true);
    } catch (err) {
      next(err);
    }
  },
  async update(req, res, next) {
    try {
      await userService
        .update(req.user, req.body, getParametersForBlacklistingAtoken(req));
      res.status(200).send('Update success');
      next();
    } catch (err) {
      next(err);
    }
  },
  async delete(req, res, next) {
    try {
      await userService.delete(req.params.id);
      res.status(HTTP_STATUS_CODES.SUCCESS_200).send('Delete success');
    } catch (err) {
      next(err);
    }
  },
  async getAllUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();
      res.status(HTTP_STATUS_CODES.SUCCESS_200).send(users);
    } catch (err) {
      next(err);
    }
  },
  async token(req, res, next) {
    try {
      const { email } = req.body;
      const refreshToken = req.cookies[tokenCookieName];
      const accessToken = await userService.getNewAccessToken(email, refreshToken);
      if (accessToken) res.send({ accessToken });
    } catch (err) {
      next(err);
    }
  },
  async logoff(req, res, next) {
    try {
      userService.logoff(getParametersForBlacklistingAtoken(req));
      // res.clearCookie(tokenCookieName);
      res.cookie(tokenCookieName, '', cookieDestroyOptions);
      res.send('log-off successful');
    } catch (err) {
      next(err);
    }
  },
  async generateOTP(req, res, next) {
    try {
      const { email, type } = req.body;
      await userService.generateOTP(email, null, type);
      res.status(HTTP_STATUS_CODES.SUCCESS_200);
    } catch (err) {
      next(err);
    }
  },
  async verifyOTP(req, res, next) {
    try {
      const { email, otp } = req.body;
      await userService.verifyOTP(email, otp);
      res.status(HTTP_STATUS_CODES.SUCCESS_200).send('User email verified');
    } catch (err) {
      next(err);
    }
  },
  async forgotPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;
      await userService.forgotPassword(email, otp, newPassword);
      res.status(HTTP_STATUS_CODES.SUCCESS_200).send('Password reset success, please login with new password');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userController;
