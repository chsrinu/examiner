/* eslint-disable no-underscore-dangle */
/* eslint-disable no-return-await */
/* eslint-disable global-require */
/* eslint-disable no-undef */

require('../../../../../globals/fileImportWrapper');

const dbService = include('server/tests/dbService');
const { userService } = include('server/src/modules/user/services');
const { HTTP_STATUS_CODES, USER_STATUS, EMAIL_TYPE } = include('server/src/helpers/enums');
const { cachingMiddleware } = include('server/src/global-middleware');
const { emailService } = include('server/src/global-services');

jest.mock('redis', () => require('redis-mock'));
jest.mock('../../../../../src/helpers/lruCache');
jest.mock('../../../../../src/global-middleware/cachingMiddleware', () => ({
  isRefreshTokenValid: jest.fn().mockReturnValue(false).mockReturnValueOnce(true),
  cacheTokenAsync: jest.fn(),
  getAccessToken: jest.fn().mockReturnValueOnce('AccessTokenFromCache'),
  getRefreshToken: jest.fn().mockReturnValueOnce('RefreshTokenFromCache'),
  revokeAccessToken: jest.fn(),
  addTokenToBlackList: jest.fn(),
  revokeCachedResponses: jest.fn(),
}));
jest.mock('../../../../../src/helpers/tokenizer', () => ({
  generateAccessToken: jest.fn().mockReturnValue('AccessToken'),
  generateRefreshToken: jest.fn().mockReturnValue('RefreshToken'),
}));
jest.mock('../../../../../../server/src/global-services/emailService', () => ({
  sendEmail: jest.fn(),
}));

// jest.mock('../../../../../src/global-services/secretCodeService', () => ({
//   generateCode: jest.fn().mockReturnValue({
//     _id: '604f070cb8f40de4359e25c2',
//     secretCode: '123456',
//     dateCreated: Date.now(),
//   }),
// }));

const validUser = {
  email: 'test56@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};
const activeUser = {
  email: 'test56@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
  status: 'ACTIVE',
};
const accessTokenParams = {
  refreshToken: 'abc',
  email: 'test@gmail.com',
};

const logOffParams = {
  token: 'accessToken',
  expiryTime: 'ExpireTimeOfAccessToken',
  email: 'test@gmail.com',
};

beforeAll(async () => dbService.connect());
afterEach(async () => dbService.clearDatabase());
afterAll(async () => dbService.closeDatabase());

describe('UserService TestSuite', () => {
  describe('Creating a user', () => {
    it('Successfully created the user', async () => {
      await userService.create(validUser);
      const savedUser = await userService.getUserWithSecretCode(validUser.email);
      expect(savedUser).toBeDefined();
      expect(savedUser.email).toBe(validUser.email);
      expect(savedUser.verificationCode).toBeDefined();
      expect(savedUser.verificationCode.code).toBeDefined();
    });
    it('Unique constraint exception on email', async () => {
      let err;
      try {
        // duplicate user
        await userService.create(validUser);
        await userService.create(validUser);
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
    });
  });

  describe('User verification', () => {
    it('Generate OTP', async () => {
      await userService.create(validUser);
      const savedUser = await userService.getUserWithSecretCode(validUser.email);
      await userService.generateOTP(validUser.email, null, EMAIL_TYPE.USER_REGISTRATION);
      expect(emailService.sendEmail).toBeCalledWith(
        savedUser.email,
        savedUser.firstName,
        savedUser.verificationCode.code,
        EMAIL_TYPE.USER_REGISTRATION,
      );
    });
    it('Verify correct OTP', async () => {
      let err;
      try {
        await userService.create(validUser);
        const savedUser = await userService.getUserWithSecretCode(validUser.email);
        await userService.verifyOTP(validUser.email, savedUser.verificationCode.code);
        const statusUpdatedUser = await userService.findUserByEmailId(validUser.email);
        expect(statusUpdatedUser.status).toBe(USER_STATUS.ACTIVE);
      } catch (e) {
        err = e;
      }
      expect(err).not.toBeDefined();
    });
    it('Verify incorrect OTP', async () => {
      let err;
      try {
        await userService.create(validUser);
        await userService.verifyOTP(validUser.email, '');
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(HTTP_STATUS_CODES.UNAUTHORIZED_401);
      expect(err.message).toBe('OTP Invalid/Expired');
    });
  });

  describe('Reading user', () => {
    it('With valid emailId', async () => {
      const user = await userService.read(validUser);
      expect(user.firstName).toBe(validUser.firstName);
    });
    it('With invalid user details', async () => {
      const user = await userService.read({});
      expect(user.firstName).toBeUndefined();
      expect(user.lastName).toBeUndefined();
      expect(user.email).toBeUndefined();
    });
  });
  describe('Update User', () => {
    it('with invalid user', async () => {
      let err;
      try {
        await userService.update();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
    });
    it('with valid user', async () => {
      let err; let updatedUser;
      try {
        await userService.create(validUser);
        const userSaved = await userService.findUserByEmailId(validUser.email);
        const updates = {
          firstName: 'fir',
        };
        await userService.update(userSaved, updates);
        updatedUser = await userService.findUserByEmailId(validUser.email);
      } catch (e) {
        err = e;
      }
      expect(err).not.toBeDefined();
      expect(updatedUser.firstName).toBe('fir');
      expect(cachingMiddleware.revokeCachedResponses).toBeCalled();
      expect(cachingMiddleware.revokeAccessToken).not.toBeCalled();
      expect(cachingMiddleware.addTokenToBlackList).not.toBeCalled();
    });
    it('password update', async () => {
      let err; let updatedUser;
      try {
        await userService.create(validUser);
        const userSaved = await userService.findUserByEmailId(validUser.email);
        const updates = {
          oldPassword: 'abcdefgh',
          newPassword: 'lmnopqrs',
        };
        await userService.update(userSaved, updates, { email: '' });
        updatedUser = await userService.findUserByEmailId(validUser.email);
      } catch (e) {
        err = e;
      }
      expect(err).not.toBeDefined();
      expect(updatedUser).toBeDefined();
      expect(cachingMiddleware.revokeCachedResponses).toBeCalled();
      expect(cachingMiddleware.revokeAccessToken).toBeCalled();
      expect(cachingMiddleware.addTokenToBlackList).toBeCalled();
    });
  });
  describe('Delete user', () => {
    it('with valid id', async () => {
      await userService.create(validUser);
      const userSaved = await userService.findUserByEmailId(validUser.email);
      await userService.delete(userSaved._id);
      const userFetched = await userService.findUserByEmailId(validUser.email);
      expect(userSaved).toBeDefined();
      expect(userFetched).toBeNull();
    });
    it('with empty id', async () => {
      const id = '';
      try {
        await userService.create(validUser);
        res = await userService.delete(id);
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
    });
    it('with invalid id', async () => {
      let err;
      const id = '60b86f40adabb41be14d6fd0';
      try {
        await userService.delete(id);
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(HTTP_STATUS_CODES.NOT_FOUND_404);
      expect(err.message).toBe(`User with id ${id} not found to delete`);
    });
  });
  describe('Find user', () => {
    it('with valid emailId', async () => {
      await userService.create(validUser);
      const userFetched = await userService.findUserByEmailId(validUser.email);
      expect(userFetched._id).toBeDefined();
      expect(validUser.firstName).toEqual(userFetched.firstName);
      expect(validUser.lastName).toEqual(userFetched.lastName);
      expect(validUser.email).toEqual(userFetched.email);
      expect(userFetched.password).toBeDefined();
    });
    it('with invalid emailId', async () => {
      const userFetched = await userService.findUserByEmailId('test26@gmail.com');
      expect(userFetched).toBeNull();
    });
  });
  describe('Login user', () => {
    it('With inactive profile', async () => {
      let err;
      try {
        await userService.create(validUser);
        const tokens = await userService.login({
          email: validUser.email,
          password: validUser.password,
        });
        expect(tokens).toBeUndefined();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.message).toEqual('Please complete your email verification process.');
      expect(err.statusCode).toEqual(HTTP_STATUS_CODES.FORBIDDEN_403);
    });
    it('with tokens in cache', async () => {
      await userService.create(activeUser);
      const tokens = await userService.login({
        email: activeUser.email,
        password: activeUser.password,
      });
      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBe('AccessTokenFromCache');
      expect(tokens.refreshToken).toBe('RefreshTokenFromCache');
    });
    it('With active profile and correct password', async () => {
      let err;
      try {
        await userService.create(activeUser);
        const tokens = await userService.login({
          email: activeUser.email,
          password: activeUser.password,
        });
        expect(tokens).toBeDefined();
        expect(tokens.accessToken).toBe('AccessToken');
        expect(tokens.refreshToken).toBe('RefreshToken');
      } catch (e) {
        err = e;
      }
      expect(err).not.toBeDefined();
    });
    it('With active profile but incorrect password', async () => {
      let err;
      try {
        await userService.create(activeUser);
        const tokens = await userService.login({ email: activeUser.email, password: 'wrongPassword' });
        expect(tokens).toBeUndefined();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.message).toEqual('Username/password incorrect.');
      expect(err.statusCode).toEqual(HTTP_STATUS_CODES.UNAUTHORIZED_401);
    });
    it('With unregistered email', async () => {
      let err;
      try {
        const tokens = await userService.login({ email: 'test@gmail.com', password: 'password' });
        expect(tokens).toBeUndefined();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.message).toEqual('User does not exist, please signup.');
      expect(err.statusCode).toEqual(HTTP_STATUS_CODES.UNAUTHORIZED_401);
    });
  });
  describe('Request new Access token', () => {
    it('with valid refresh token and email', async () => {
      const accessToken = await userService.getNewAccessToken(accessTokenParams);
      expect(accessToken).toBe('AccessToken');
    });
    it('with invalid refresh token and email', async () => {
      let err;
      try {
        await userService.getNewAccessToken(accessTokenParams);
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.message).toBe('Invalid refresh token/email provided.');
      expect(err.statusCode).toBe(HTTP_STATUS_CODES.UNAUTHORIZED_401);
    });
  });
  describe('Get all users in DB', () => {
    it('with empty DB', async () => {
      const users = await userService.getAllUsers();
      expect(users).toBeDefined();
      expect(users.length).toBe(0);
    });
    it('with one user in DB', async () => {
      await userService.create(activeUser);
      const users = await userService.getAllUsers();
      expect(users).toBeDefined();
      expect(users.length).toBe(1);
      expect(users[0].email).toEqual(activeUser.email);
    });
  });
  describe('Log off user', () => {
    it('By invalidating the tokens', () => {
      const revokeAccessTokenSpy = jest.spyOn(cachingMiddleware, 'revokeAccessToken').mockImplementation();
      const tokenBlackListingSpy = jest.spyOn(cachingMiddleware, 'addTokenToBlackList').mockImplementation();
      userService.logoff(logOffParams);
      expect(revokeAccessTokenSpy).toHaveBeenCalledWith(logOffParams.email);
      expect(tokenBlackListingSpy).toHaveBeenCalledWith(logOffParams);
    });
  });
});
