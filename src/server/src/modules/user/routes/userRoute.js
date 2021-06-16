/**
 * Handles all the requests related to User Creation-Read-Update-Delete
 */

const express = require('express');

const router = express.Router();
const { userController: c } = include('server/src/modules/user/controller');
const { userValidator: v } = include('server/src/modules/user/middleware');
const { cachingMiddleware, authenticatorMiddleware: auth } = include('server/src/global-middleware');

// routes that doesn't have the accesstoken
router.post('/register', v.validateUserInRequestBody(), c.register);
router.post('/login', v.validateUserLoginCreds(), c.login);
router.post('/token', v.validateAccessTokenReqBody(), c.token);
router.post('/verifyOtp', v.validateOtpReqBody(), c.verifyOTP);
router.post('/emailVerification', v.validateEmailVerificationReqbody(), c.generateOTP);

router.use('/', auth.authenticateToken);
// routes having the access token
router
  .route('/')
  .get(cachingMiddleware.getCachedResponse, c.read)
  .patch(v.validateExisitingFields(), c.update);

router.post('/logoff', c.logoff);

router.delete('/:id', v.isMongooseIdValid(), v.isAdmin(), c.delete);
router.get('/all', v.isAdmin(), c.getAllUsers);

module.exports = router;
