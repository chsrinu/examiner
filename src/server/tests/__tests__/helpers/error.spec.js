require('../../../globals/fileImportWrapper');

const errorService = include('server/src/helpers/error');

const clientErrMessage = {
  statusCode: 404,
  message: 'Not Found',
};

const serverErrMessage = {};

const mockedResponseObj = {};

mockedResponseObj.status = jest.fn().mockReturnValue(mockedResponseObj);
mockedResponseObj.send = jest.fn().mockReturnValue(mockedResponseObj);

describe('Error Test Suite', () => {
  describe('Trigger errors', () => {
    it('Client not found 404 error', () => {
      errorService.handleError(clientErrMessage, mockedResponseObj);
      expect(mockedResponseObj.send).toBeCalledWith({
        status: 'error',
        statusCode: 404,
        message: 'Not Found',
      });
    });
    it('Internal Server error', () => {
      errorService.handleError(serverErrMessage, mockedResponseObj);
      expect(mockedResponseObj.send).toBeCalledWith({
        status: 'error',
        statusCode: 500,
        message: 'Internal Server error',
      });
    });
  });
});
