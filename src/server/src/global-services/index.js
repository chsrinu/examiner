/* eslint-disable global-require */
// not importing the db service as it's colliding with the test dbService while testing
module.exports = {
  secretCodeService: require('./secretCodeService'),
  emailService: require('./emailService'),
};
