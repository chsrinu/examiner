/**
 * Used for creating keys in cache for caching responses @url level
 * Path's added in PATH_SPECIFIC_CACHE_KEYS only will be eligible for caching other url's
 * responses will not be cached.
 */
const { PATH_SPECIFIC_CACHE_KEYS: kGen } = require('./enums');

const generator = {
  generateKey(baseUrl, email) {
    switch (baseUrl) {
      case '/user':
        return kGen.USER_PATH + email;
      default:
        return null;
    }
  },
};
module.exports = generator;
