/* eslint-disable consistent-return */
/* eslint-disable indent */
/**
 * Module for validating the requestbody for all the user related requests
 */

/* eslint-disable no-bitwise */
const mongoose = require('mongoose');
const { check, body, validationResult } = require('express-validator');

const {
 HTTP_STATUS_CODES, USER_ERRORS, EMAIL_TYPE, COMMON_ERRORS,
} = include('server/src/helpers/enums');
const { userService } = include('server/src/modules/user/services');
const registerParms = ['email', 'firstName', 'lastName', 'password'];
const updateParams = ['firstName', 'lastName', 'oldPassword', 'newPassword'];
const loginParams = ['email', 'password'];
const accessTokenBody = ['email'];
const otpReqBody = ['email', 'otp'];
const emailVerificationReqBody = ['email', 'type'];
const forgotPasswordReqBody = ['email', 'otp', 'newPassword'];

const inputValidator = {
  validateUserInRequestBody() {
    return [
      check(registerParms[0])
        .exists()
        .withMessage(USER_ERRORS.EMPTY_EMAIL)
        .isEmail()
        .withMessage(USER_ERRORS.INVALID_EMAIL)
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .normalizeEmail(),
      check(registerParms[1])
        .exists()
        .withMessage(USER_ERRORS.EMPTY_FIRSTNAME)
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .isLength({ min: 3, max: 16 })
        .withMessage(USER_ERRORS.FIRSTNAME_LENGTH_NOT_WITHIN_LIMITS),
      check(registerParms[2])
        .exists()
        .withMessage(USER_ERRORS.EMPTY_LASTNAME)
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .isLength({ min: 3, max: 16 })
        .withMessage(USER_ERRORS.LASTNAME_LENGTH_NOT_WITHIN_LIMITS),
      check(registerParms[3])
        .exists()
        .withMessage(USER_ERRORS.EMPTY_PASSWORD)
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .isLength({ min: 8, max: 16 })
        .withMessage(USER_ERRORS.PASSWORD_LENGTH_NOT_WITHIN_LIMITS),
      body().custom((reqBody) => Object.keys(reqBody)
        .every((key) => registerParms.includes(key)))
        .withMessage(USER_ERRORS.EXTRA_PARAMS),
      body().custom(async (reqBody) => {
        const user = await userService.findUserByEmailId(reqBody.email);
        if (user) return Promise.reject();
      }).withMessage(USER_ERRORS.EXISTING_EMAIL),
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY_422)
            .json({ errors: errors.array() });
        } else {
          next();
        }
      },
    ];
  },
  validateExisitingFields() {
    return [
      check(updateParams[0])
        .optional()
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .isLength({ min: 3, max: 16 })
        .withMessage(USER_ERRORS.FIRSTNAME_LENGTH_NOT_WITHIN_LIMITS),
      check(updateParams[1])
        .optional()
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .isLength({ min: 3, max: 16 })
        .withMessage(USER_ERRORS.LASTNAME_LENGTH_NOT_WITHIN_LIMITS),
      check(updateParams[2])
        .optional()
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .isLength({ min: 8, max: 16 })
        .withMessage(USER_ERRORS.PASSWORD_LENGTH_NOT_WITHIN_LIMITS),
      check(updateParams[3])
        .optional()
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .isLength({ min: 8, max: 16 })
        .withMessage(USER_ERRORS.PASSWORD_LENGTH_NOT_WITHIN_LIMITS),
      body().custom((reqBody) => (!(Boolean(reqBody.oldPassword) ^ Boolean(reqBody.newPassword))))
        .withMessage(USER_ERRORS.MISSING_PARAMS_IN_UPDATE),
      body().custom((reqBody) => Object.keys(reqBody).every((key) => updateParams.includes(key)))
        .withMessage(USER_ERRORS.EXTRA_OR_INVALID_PARAMS_IN_UPDATE),
      body().custom((reqBody) => Object.keys(reqBody).length !== 0)
        .withMessage(USER_ERRORS.EMPTY_BODY),
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY_422).json({ errors: errors.array() });
        } else {
          next();
        }
      },
    ];
  },
  validateUserLoginCreds() {
    return [
      check(loginParams[0])
        .exists()
        .withMessage(USER_ERRORS.EMPTY_EMAIL)
        .isEmail()
        .withMessage(USER_ERRORS.INVALID_EMAIL)
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .normalizeEmail(),
      check(loginParams[1])
        .exists()
        .withMessage(USER_ERRORS.EMPTY_PASSWORD)
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .isLength({ min: 8, max: 16 })
        .withMessage(USER_ERRORS.PASSWORD_LENGTH_NOT_WITHIN_LIMITS),
      body().custom((reqBody) => Object.keys(reqBody).every((key) => loginParams.includes(key)))
        .withMessage(USER_ERRORS.EXTRA_OR_INVALID_PARAMS_IN_LOGIN),
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY_422).json({ errors: errors.array() });
        } else {
          next();
        }
      },
    ];
  },
  isMongooseIdValid() {
    return [
      (req, res, next) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) res.status(HTTP_STATUS_CODES.BAD_REQUEST_400).send(`Invalid id ${req.params.id}`);
        else next();
      },
    ];
  },
  isAdmin() {
    return [
      (req, res, next) => {
        req.user.isAdmin(req.user.role, (isAdmin) => {
          if (!isAdmin) res.status(HTTP_STATUS_CODES.FORBIDDEN_403).send('Request forbidden');
          else next();
        });
      },
    ];
  },
  validateAccessTokenReqBody() {
    return [
      check(accessTokenBody[0])
        .exists()
        .withMessage(USER_ERRORS.EMPTY_EMAIL)
        .isEmail()
        .withMessage(USER_ERRORS.INVALID_EMAIL)
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .normalizeEmail(),
      // check(accessTokenBody[1])
      //   .exists()
      //   .withMessage(USER_ERRORS.EMPTY_REFRESH_TOKEN)
      //   .isString()
      //   .withMessage(COMMON_ERRORS.EXPECTED_STRING)
      //   .trim()
      //   .isLength({ min: 80, max: 80 })
      //   .withMessage(USER_ERRORS.INVALID_REFRESH_TOKEN),
      body().custom((reqBody) => Object.keys(reqBody).every((key) => accessTokenBody.includes(key)))
        .withMessage(USER_ERRORS.EXTRA_OR_INVALID_PARAMS_IN_TOKEN_REQUEST),
      body().custom(async (reqBody) => {
          const user = await userService.findUserByEmailId(reqBody.email);
          if (!user) return Promise.reject();
      }).withMessage(USER_ERRORS.USER_NOT_FOUND),
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY_422).json({ errors: errors.array() });
        } else {
          next();
        }
      },
    ];
  },
  validateOtpReqBody() {
    return [
      check(otpReqBody[0])
        .exists()
        .withMessage(USER_ERRORS.EMPTY_EMAIL)
        .isEmail()
        .withMessage(USER_ERRORS.INVALID_EMAIL)
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .normalizeEmail(),
      check(otpReqBody[1])
        .exists()
        .withMessage(USER_ERRORS.EMPTY_OTP)
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage(USER_ERRORS.OTP_INVALID_LENGTH),
      body().custom((reqBody) => Object.keys(reqBody).every((key) => otpReqBody.includes(key)))
        .withMessage(USER_ERRORS.EXTRA_OR_INVALID_PARAMS_IN_OTP),
      body().custom(async (reqBody) => {
        const user = await userService.findUserByEmailId(reqBody.email);
        if (!user) return Promise.reject();
      }).withMessage(USER_ERRORS.USER_NOT_FOUND),
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY_422).json({ errors: errors.array() });
        } else {
          next();
        }
      },
    ];
  },

  validateEmailVerificationReqbody() {
    return [
      check(emailVerificationReqBody[0])
        .exists()
        .withMessage(USER_ERRORS.EMPTY_EMAIL)
        .isEmail()
        .withMessage(USER_ERRORS.INVALID_EMAIL)
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .normalizeEmail(),
      check(emailVerificationReqBody[1])
        .exists()
        .withMessage(USER_ERRORS.INVALID_VERIFICATION_REASON)
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .isIn(Object.keys(EMAIL_TYPE))
        .withMessage(USER_ERRORS.INVALID_EMAIL_TYPE),
      body().custom((reqBody) => Object.keys(reqBody)
        .every((key) => emailVerificationReqBody.includes(key)))
        .withMessage(USER_ERRORS.EXTRA_PARAMS),
      body().custom(async (reqBody) => {
        const user = await userService.findUserByEmailId(reqBody.email);
        if (!user) return Promise.reject();
      }).withMessage(USER_ERRORS.USER_NOT_FOUND),
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY_422).json({ errors: errors.array() });
        } else {
          next();
        }
      },
    ];
  },
  forgotPasswordValidation() {
    return [
      check(forgotPasswordReqBody[0])
        .exists()
        .withMessage(USER_ERRORS.EMPTY_EMAIL)
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .isEmail()
        .withMessage(USER_ERRORS.INVALID_EMAIL)
        .trim()
        .normalizeEmail(),
      check(forgotPasswordReqBody[1])
        .exists()
        .withMessage(USER_ERRORS.EMPTY_OTP)
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage(USER_ERRORS.OTP_INVALID_LENGTH),
      check(forgotPasswordReqBody[2])
        .exists()
        .withMessage(USER_ERRORS.MISSING_PASSWORD)
        .isString()
        .withMessage(COMMON_ERRORS.EXPECTED_STRING)
        .trim()
        .isLength({ min: 8, max: 16 })
        .withMessage(USER_ERRORS.PASSWORD_LENGTH_NOT_WITHIN_LIMITS),
    ];
  },
};
module.exports = inputValidator;
