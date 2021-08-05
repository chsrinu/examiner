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
  MISSING_PASSWORD: 'Password is mandatory while resetting the password',
  INVALID_EMAIL_TYPE: 'Email type is Invalid',

};

/* Error messages that can be used by middleware in responses
when validation fails  @rest endpoint https://<BASE_URL>/test/:testId/question */
exports.QUESTION_ERRORS = {

};

exports.COMMON_ERRORS = {
  EXPECTED_ARRAY: 'Expected the value of this element to be an array',
  EXPECTED_STRING: 'Expected the value of this element to be a string',
  EXPECTED_BOOLEAN: 'Expected the value of this element to be a boolean',
  EXPECTED_OBJECT: 'Expected the value of this element to be an Object',
};

/* Error messages that can be used by middleware in responses
when validation fails  @rest endpoint https://<BASE_URL>/test */
exports.EXAM_ERRORS = {
  EXAM_NAME_MISSING: 'Exam name is missing',
  EXAMINER_EMAIL_MISSING: 'Examiner email is missing',
  EXAM_DURATION_MISSING: 'Exam duration is missing',
  EXAM_MARKS_MISSING: 'Exam marks are missing',
  EXAMTAKER_CATEGORY_MISSING: 'Exam taker category is missing',
  EXAM_NAME_LENGTH_VALIDATION_FAILURE: 'Exam name length should be between 3 and 16',
  INVALID_EXAMINER_EMAIL: 'Examiner email is invalid',
  INVALID_NUMBER_IN_EXAM_DURATION: 'Please provide a valid number for exam duration in mins',
  INVALID_NUMBER_IN_EXAM_MARKS: 'Please provide a valid number in maximum marks',
  INVALID_EXAM_ID: 'Missing/Invalid mongoose ID',
  INVALID_QUESTION_TYPE: 'Invalid question type',
  MISSING_UPDATES_ELEMENT: 'Updates element is missing',
  EXPECTED_ARRAY: 'Expected the value of this element to be an array',
  EXPECTED_STRING: 'Expected the value of this element to be a string',
  EXPECTED_BOOLEAN: 'Expected the value of this element to be a boolean',
  EXPECTED_OBJECT: 'Expected the value of this element to be an Object',
  QUESTION_LENGTH_VALIDATION_FAILURE: 'Length of this question is either below 5 or beyond 600 characters',
  OPTION_LENGTH_VALIDATION_FAILURE: 'Length of this option is either below 1 or beyond 150 characters',
  EMPTY_ARRAY: 'Array should not be Empty',
  EMPTY_OBJECT: 'Empty object found, please check..',
  INVALID_OPTIONS_UPDATE: 'Missing option id or newValue in option update',
  INVALID_PROPERTIES_FOUND: 'Found some invalid params which cannot be processed',
  UPDATES_MISSING: 'Properties that needs to be updated are missing',
  MISSING_ANSWERS_OBJECT: 'Answers are missing in your submission',
  MISSING_MANDATORY_PROPS: 'Some mandatory params are missing/empty, please check',
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
  EXAM_PATH: 'exam_',
};

exports.EMAIL_TYPE = {
  USER_REGISTRATION: 'USER_REGISTRATION',
  RESET_PASSWORD: 'RESET_PASSWORD',
};

exports.QUESTION_TYPES = [
  'MULTIPLE_CHOICE_QUESTION_WITH_SINGLE_ANSWER',
  'MULTIPLE_CHOICE_QUESTION_WITH_MULTIPLE_ANSWERS',
  'FILL_IN_THE_BLANK',
  'TRUE_OR_FALSE',
];

exports.EXAMTAKER_CATEGORY = [
  'SCHOOL_KID',
  'COLLEGE_STUDENT',
  'EMPLOYEE',
];
