/**
 * Constants that can be used accross the server side
 */
exports.HTTP_STATUS_CODES = {
  // status codes for successful requests
  SUCCESS_200: 200,
  CREATED_201: 201,
  // status codes for errors on client side
  BAD_REQUEST_400: 400,
  UNPROCESSABLE_ENTITY_422: 422,
  // status codes for errors on server side
  SERVER_ERROR_500: 500,
  UNAUTHORIZED_401: 401,
  FORBIDDEN_403: 403,
  NOT_FOUND_404: 404,
  METHOD_NOT_ALLOWED_405: 405,
};
/* Error messages that can be used by middleware in responses
when validation fails  @rest endpoint https://<BASE_URL>/user */
exports.USER_ERRORS = {
  EMPTY_EMAIL: 'Email should not be empty',
  INVALID_EMAIL: 'Invalid emailId!!',
  EMPTY_FIRSTNAME: 'firstName should not be empty',
  FIRSTNAME_LENGTH_NOT_WITHIN_LIMITS: 'firstName length should be between 3 and 16',
  EMPTY_LASTNAME: 'lastName should not be empty',
  LASTNAME_LENGTH_NOT_WITHIN_LIMITS: 'lastName length should be between 3 and 16',
  EMPTY_PASSWORD: 'password should not be empty',
  PASSWORD_LENGTH_NOT_WITHIN_LIMITS: 'password length should be between 8 and 16',
  EXTRA_PARAMS: 'Some extra parameters are sent which are invalid',
  EXTRA_OR_INVALID_PARAMS_IN_UPDATE: 'Some extra parameters are sent, which are invalid or not allowed in update',
  EXISTING_EMAIL: 'User already registered',
  USER_NOT_FOUND: 'Email is not registered with us',
  EXTRA_OR_INVALID_PARAMS_IN_LOGIN: 'Some extra parameters are sent, which are invalid or not allowed in login',
  MISSING_PARAMS_IN_UPDATE: 'Some parameters are missing in update, please check and retry.',
  EMPTY_REFRESH_TOKEN: 'Refresh token should not be empty',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  EXTRA_OR_INVALID_PARAMS_IN_TOKEN_REQUEST: 'Some extra params are sent, which are invalid in access token request',
  EMPTY_BODY: 'Empty request body, Please pass in the necessary params to process',
  OTP_INVALID_LENGTH: 'Invalid length of OTP, min/max length is 6',
  EMPTY_OTP: 'OTP field is mandatory for email verification',
  EXTRA_OR_INVALID_PARAMS_IN_OTP: 'Some extra params are sent, which are invalid in email verification',
  INVALID_VERIFICATION_REASON: 'Invalid email verification reason',
};

/* Error messages that can be used by middleware in responses
when validation fails  @rest endpoint https://<BASE_URL>/test/:testId/question */
exports.QUESTION_ERRORS = {

};

/* Error messages that can be used by middleware in responses
when validation fails  @rest endpoint https://<BASE_URL>/test */
exports.TEST_ERRORS = {

};

exports.roles = {
  USER: 'USER',
  ADMIN: 'ADMIN',
};

exports.USER_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
};

exports.TOKEN_TYPES = {
  ACCESS_TOKEN: 'access_',
  REFRESH_TOKEN: 'refresh_',
  BLACK_LIST_TOKEN: 'black_',
};

exports.PATH_SPECIFIC_CACHE_KEYS = {
  USER_PATH: 'user_',
};

exports.EMAIL_TYPE = {
  USER_REGISTRATION: 'USER_REGISTRATION',
  RESET_PASSWORD: 'RESET_PASSWORD',
};
