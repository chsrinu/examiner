/* eslint-disable vars-on-top */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable global-require */
/* eslint-disable no-var */
require('dotenv').config();
require('../../../globals/fileImportWrapper');

const cachingMiddleware = include('server/src/global-middleware/cachingMiddleware');
const { TOKEN_TYPES } = include('server/src/helpers/enums');

var mockRedis;
var redisClient;

jest.mock('redis', () => {
  mockRedis = require('redis-mock');
  return mockRedis;
});

beforeAll(() => {
  redisClient = mockRedis.createClient();
});
afterEach(() => {
  redisClient.del('refresh_test@gmail.com');
  redisClient.del('access_test@gmail.com');
});

describe('Redis caching Test suite', () => {
  describe('Tokens in redis', () => {
    it('When no active tokens in cache', async () => {
      const tokens = await cachingMiddleware.isActiveToken('test@gmail.com');
      const refreshToken = await cachingMiddleware.getRefreshToken('test@gmail.com');
      const accessToken = await cachingMiddleware.getAccessToken('test@gmail.com');
      expect(refreshToken).toBeNull();
      expect(accessToken).toBeNull();
      expect(tokens).toBeNull();
    });
    it('When active tokens in cache', async () => {
      redisClient.set('refresh_test@gmail.com', 'refreshToken');
      redisClient.set('access_test@gmail.com', 'accessToken');
      const refreshToken = await cachingMiddleware.getRefreshToken('test@gmail.com');
      const accessToken = await cachingMiddleware.getAccessToken('test@gmail.com');
      const tokens = await cachingMiddleware.isActiveToken('test@gmail.com');
      expect(refreshToken).toBe('refreshToken');
      expect(accessToken).toBe('accessToken');
      expect(tokens).toEqual({ accessToken, refreshToken });
    });
    it('Cache tokens async', async () => {
      await cachingMiddleware.cacheTokenAsync('test@gmail.com', 'accessToken', TOKEN_TYPES.ACCESS_TOKEN, true);
      const accessToken = await cachingMiddleware.getAccessToken('test@gmail.com');
      expect(accessToken).toBe('accessToken');
      await cachingMiddleware.cacheTokenAsync('test@gmail.com', 'refreshToken', TOKEN_TYPES.REFRESH_TOKEN, false);
      const refreshToken = await cachingMiddleware.getRefreshToken('test@gmail.com');
      expect(refreshToken).toBe('refreshToken');
    });
    it('check with a valid refresh token', async () => {
      redisClient.set('refresh_test@gmail.com', 'refreshToken');
      const tokenValid = await cachingMiddleware.isRefreshTokenValid('test@gmail.com', 'refreshToken');
      expect(tokenValid).toBeTruthy();
    });
    it('check with a invalid refresh token', async () => {
      const tokenValid = await cachingMiddleware.isRefreshTokenValid('test@gmail.com', 'refreshToken');
      expect(tokenValid).toBeFalsy();
    });
    it('revoke all tokens', async () => {
      redisClient.set('refresh_test@gmail.com', 'refreshToken');
      redisClient.set('access_test@gmail.com', 'accessToken');
      await cachingMiddleware.revokeAllTokens('test@gmail.com');
      const refreshToken = await cachingMiddleware.getRefreshToken('test@gmail.com');
      const accessToken = await cachingMiddleware.getAccessToken('test@gmail.com');
      expect(refreshToken).toBeNull();
      expect(accessToken).toBeNull();
    });
    it('revoke access tokens', async () => {
      redisClient.set('access_test@gmail.com', 'accessToken');
      await cachingMiddleware.revokeAccessToken('test@gmail.com');
      const accessToken = await cachingMiddleware.getAccessToken('test@gmail.com');
      expect(accessToken).toBeNull();
    });
    it('Add a token to blacklist', async () => {
      const token = 'BlackListedToken';
      const expiryTime = 900;
      const email = 'test@gmail.com';
      await cachingMiddleware.addTokenToBlackList({ token, expiryTime, email });
      const isBlackListedToken = await cachingMiddleware.isTokenBlackListed(token);
      expect(isBlackListedToken).toBeTruthy();
    });
    it('Check token in blacklist', async () => {
      const isBlackListedToken = await cachingMiddleware.isTokenBlackListed('accessToken');
      expect(isBlackListedToken).toBeFalsy();
    });
  });
});
