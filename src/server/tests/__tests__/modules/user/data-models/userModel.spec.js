/* eslint-disable no-undef */
require('../../../../../globals/fileImportWrapper');

const { UserModel } = include('server/src/modules/user/data-models');

let isAdmin;

const validUser = {
  email: 'test56@GMAIL.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

const modelCallback = (result, error) => {
  if (error) throw error;
  else isAdmin = result;
};

describe('User model test suite', () => {
  it('Admin check', () => {
    const user = new UserModel(validUser);
    user.isAdmin('ADMIN', modelCallback);
    expect(isAdmin).toBeTruthy();
  });
  it('User check', () => {
    const user = new UserModel(validUser);
    user.isAdmin('USER', modelCallback);
    expect(isAdmin).toBeFalsy();
  });
});
