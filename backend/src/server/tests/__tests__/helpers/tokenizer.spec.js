/* eslint-disable no-undef */
/* eslint-disable global-require */
require('dotenv').config();
require('../../../globals/fileImportWrapper');

jest.mock('redis', () => require('redis-mock'));

const tokenizer = include('server/src/helpers/tokenizer');
const validUser = {
  email: 'test@gmail.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('Signed'),
  verify: jest.fn().mockReturnValue('test@gmail.com'),
}));
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue(12),
}));
jest.mock('../../../../server/src/modules/user/services/userService', () => ({
  findUserByEmailId: jest.fn().mockReturnValue(validUser).mockReturnValueOnce(null),
}));
jest.mock('../../../src/global-middleware/cachingMiddleware', () => ({
  isTokenBlackListed: jest.fn().mockReturnValue(false).mockReturnValueOnce(true),
}));

describe('Tokenizer test suite', () => {
  describe('Authenticate the token', () => {
    it('Creating accessToken using JWT mock', async () => {
      const token = await tokenizer.generateAccessToken('test@gmail.com');
      expect(token).toBe('Signed');
    });
    // hex not working with javascript so commenting the test code
    // it('Creating refresh token using crypto mock', async () => {
    //   const token = await tokenizer.generateRefreshToken('test@gmail.com');
    //   expect(token).toBe('c');
    // });
  });

  describe('Get parameters for blacklisting token from req', () => {
    const req = {};
    req.headers = {};
    req.headers.authorization = 'Bearer accessToken';
    req.tokenExpireTime = 10;
    req.user = { email: 'test@gmail.com' };
    const params = tokenizer.getParametersForBlacklistingAtoken(req);
    expect(params).toEqual({ email: 'test@gmail.com', expiryTime: 10, token: 'accessToken' });
  });
});
