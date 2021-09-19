require('../../../globals/fileImportWrapper');

const authenticator = include('server/src/global-middleware/authenticatorMiddleware');

const nextCallback = jest.fn();

const mockedResponseObj = {};

mockedResponseObj.status = jest.fn().mockReturnValue(mockedResponseObj);
mockedResponseObj.send = jest.fn().mockReturnValue(mockedResponseObj);

jest.mock('../../../../server/src/global-middleware/cachingMiddleware', () => ({
  isTokenBlackListed: jest.fn().mockReturnValue(false).mockReturnValueOnce(true),
}));

describe('Token authenticator test suite', () => {
  it('authenticate the blacklisted token', async () => {
    const req = {};
    req.headers = {};
    req.headers.authorization = 'Bearer accessToken';
    // const res = {};
    // res.status = jest.fn();
    // res.send = jest.fn();
    await authenticator.authenticateToken(req, mockedResponseObj, nextCallback);
    expect(mockedResponseObj.status).toBeCalledWith(401);
  });
  it('authenticate request without a token', async () => {
    const req = {};
    req.headers = {};
    req.headers.authorization = 'Bearer';

    await authenticator.authenticateToken(req, mockedResponseObj, nextCallback);
    expect(mockedResponseObj.status).toBeCalledWith(401);
  });
  it('authenticate the valid token', async () => {
    const req = {};
    req.headers = {};
    req.headers.authorization = 'Bearer accessToken';
    // const res = {};
    // res.status = jest.fn();
    // res.send = jest.fn();
    await authenticator.authenticateToken(req, mockedResponseObj, nextCallback);
    expect(nextCallback).toBeCalled();
  });
});
