/**
 * Used for creating keys in cache for caching responses @url level
 * Path's added in PATH_SPECIFIC_CACHE_KEYS only will be eligible for caching other url's
 * responses will not be cached.
 */
const { PATH_SPECIFIC_CACHE_KEYS: kGen } = require('./enums');

const generator = {
  generateKey(req, res) {
    switch (req.baseUrl) {
      case '/user':
        return kGen.USER_PATH + req.user.email;
      case '/exam':
        // eslint-disable-next-line no-case-declarations
        const examKey = this.getExamPathKey(req, res);
        if (examKey) {
          if (Array.isArray(examKey)) {
            return examKey.map((k) => kGen.EXAM_PATH + k);
          }
          return kGen.EXAM_PATH + examKey;
        }
        return null;
      default:
        return null;
    }
  },
  getExamPathKey(req, res) {
    if (req.params.id) {
      return `${req.params.id}`;
    } if (req.query.examinerEmail && req.query.examName) {
      return `${req.query.examinerEmail}_${req.query.examName}`;
      // when user updates a question get the above keys for deleting
    } if (res && req.body.examId) {
      const id = req.body.examId;
      const examinerEmail = req.user.email;
      const { examName } = res.locals;
      return [id, `${examinerEmail}_${examName}`];
    }
    return null;
  },
};
module.exports = generator;
