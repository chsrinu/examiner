/* Module for handling all user related functions */

/* eslint-disable no-param-reassign */
/* eslint-disable object-curly-newline */
/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */

const { UserModel } = include('server/src/modules/user/data-models');
const { enums, LruCache, tokenizer, error } = include('server/src/helpers');
const cachingMiddleware = include('server/src/global-middleware/cachingMiddleware');
const logger = include('server/src/helpers/logger')(__filename);
const { emailService, secretCodeService } = include('server/src/global-services');

const { ErrorHandler } = error;
const { HTTP_STATUS_CODES, TOKEN_TYPES, USER_STATUS, EMAIL_TYPE } = enums;
const { generateAccessToken, generateRefreshToken } = tokenizer;

const altKeyGenerator = (user) => (user.email);
const userCache = new LruCache('UserCache', process.env.USER_LRU_CACHE_SIZE, altKeyGenerator);

const userService = {
  async create(param) {
    const user = new UserModel(param);
    const savedUser = await user.save();
    await this.generateOTP(savedUser.email, savedUser, EMAIL_TYPE.USER_REGISTRATION);
  },
  async addVerificationCodeToUser(userId, codeId) {
    return UserModel.findOneAndUpdate(
      { _id: userId },
      { verificationCode: codeId },
      { new: true },
    );
  },
  async read(user) {
    const { firstName, lastName, email } = user;
    return { firstName, lastName, email };
  },
  async update(user, updates, tokenDetails) {
    const { firstName, lastName, oldPassword, newPassword } = updates;
    let passwordUpdated = false;
    if (firstName) {
      user.firstName = firstName;
    }
    if (lastName) {
      user.lastName = lastName;
    }
    if (oldPassword) {
      const match = await user.comparePassword(oldPassword);
      if (match) {
        user.password = newPassword;
        passwordUpdated = true;
      } else throw new ErrorHandler(HTTP_STATUS_CODES.UNAUTHORIZED_401, 'Current password is Invalid');
    }
    const updatedUser = await user.save();
    userCache.updateValue(updatedUser.email, updatedUser);
    if (updatedUser) {
      // revoke all the tokens and other cache entries
      if (passwordUpdated) {
        this.logoff(tokenDetails);
      }
      // cachingMiddleware.revokeCachedResponses(reqCacheUrl, user.email);
      // logger.info('Removed all the cache responses and tokens');
    } else {
      logger.error('User object undefined, unable to update');
      this.throwServerError();
    }
  },
  async delete(id) {
    const deleteRes = await UserModel.deleteOne({ _id: id });
    if (!(deleteRes && deleteRes.deletedCount > 0)) {
      throw new ErrorHandler(HTTP_STATUS_CODES.NOT_FOUND_404, `User with id ${id} not found to delete`);
    }
  },
  async findUserByEmailId(email) {
    let user = userCache.get(email);
    if (!user) {
      user = await UserModel.findOne({ email });
      if (user) userCache.set(email, user);
    }
    return user;
  },
  async findUserById(id) {
    let user = userCache.get(id);
    if (!user) {
      user = await UserModel.findOne({ _id: id });
      if (user) userCache.set(id, user);
    }
    return user;
  },
  async getUserWithSecretCode(email) {
    return UserModel.findOne({ email }).populate('verificationCode');
  },
  async login(params) {
    const { email, password } = params;
    const user = await this.findUserByEmailId(email);
    if (user && user.status === USER_STATUS.ACTIVE) {
      const match = await user.comparePassword(password);
      if (match) {
        let accessToken = await cachingMiddleware.getAccessToken(email);
        let refreshToken = await cachingMiddleware.getRefreshToken(email);
        if (!accessToken) {
          accessToken = generateAccessToken(email);
          cachingMiddleware.cacheTokenAsync(email, accessToken, TOKEN_TYPES.ACCESS_TOKEN, true);
        }
        if (!refreshToken) {
          refreshToken = generateRefreshToken();
          cachingMiddleware.cacheTokenAsync(email, refreshToken, TOKEN_TYPES.REFRESH_TOKEN, false);
        }
        return { accessToken, refreshToken };
      }
      throw new ErrorHandler(HTTP_STATUS_CODES.UNAUTHORIZED_401, 'Username/password incorrect.');
    } else if (user && user.status !== USER_STATUS.ACTIVE) {
      throw new ErrorHandler(HTTP_STATUS_CODES.FORBIDDEN_403, 'Please complete your email verification process.');
    } else {
      throw new ErrorHandler(HTTP_STATUS_CODES.UNAUTHORIZED_401, 'User does not exist, please signup.');
    }
  },
  async getNewAccessToken(email, refreshToken) {
    let accessToken = await cachingMiddleware.getAccessToken(email);
    if (!accessToken) {
      if (await cachingMiddleware.isRefreshTokenValid(email, refreshToken) === true) {
        accessToken = generateAccessToken(email);
        await cachingMiddleware.cacheTokenAsync(email, accessToken, TOKEN_TYPES.ACCESS_TOKEN, true);
      } else {
        throw new ErrorHandler(HTTP_STATUS_CODES.UNAUTHORIZED_401, 'Invalid refresh token/email provided.');
      }
    }
    return accessToken;
  },
  async getAllUsers() {
    return UserModel.find();
  },
  async generateOTP(email, user, emailType) {
    if (!user) {
      user = await this.getUserWithSecretCode(email);
    }
    let secretCode;
    if (user.verificationCode) {
      // resend the same code until it gets expired
      secretCode = user.verificationCode;
    } else {
      secretCode = await secretCodeService.generateCode();
      this.addVerificationCodeToUser(user._id, secretCode._id);
    }
    await emailService.sendEmail(email, user.firstName, secretCode.code, emailType);
  },
  async verifyOTP(email, otp) {
    const user = await this.getUserWithSecretCode(email);
    if (user && user.verificationCode && user.verificationCode.code === otp) {
      // If user is already active then will allow the user to reset password
      if (user.status !== USER_STATUS.ACTIVE) {
        user.status = USER_STATUS.ACTIVE;
        await user.save();
      }
      await secretCodeService.deleteCode(user.verificationCode._id);
    } else {
      throw new ErrorHandler(HTTP_STATUS_CODES.UNAUTHORIZED_401, 'OTP Invalid/Expired');
    }
  },
  async forgotPassword(email, otp, newPassword) {
    await this.verifyOTP(email, otp);
    const user = await this.findUserByEmailId(email);
    user.password = newPassword;
    await user.save();
  },
  logoff(params) {
    cachingMiddleware.revokeAccessToken(params.email);
    cachingMiddleware.addTokenToBlackList(params);
  },
  throwServerError() {
    throw new ErrorHandler(HTTP_STATUS_CODES.SERVER_ERROR_500, 'Internal Server error');
  },
  getUserCache() {
    return userCache;
  },
};

module.exports = userService;
