const express = require('express');

const { examController: c } = include('server/src/modules/exam/controllers');
const { examValidator: v } = include('server/src/modules/exam/middleware');
const { cachingMiddleware, authenticatorMiddleware: auth } = include('server/src/global-middleware');

const router = express.Router();
/**
 * Create and Read
 */

router.use('/', auth.authenticateToken);

router.route('/')
  .post(v.createExamValidations(), c.createExam)
  .get(v.getExamByNameValidations(), cachingMiddleware.getCachedResponse, c.getExamByName);

router.post('/submitAnswers', v.submitAnswersValidations(), c.submitAnswers);

/**
 * Read
 */
router.get('/:id', v.isValidMongooseId(), cachingMiddleware.getCachedResponse, c.getExamById);
/* TODO add validation such that only examiner who had created the exam
 should be able to call this endpoint */
router.get('/editMode/:id', v.isValidMongooseId(), v.isExaminer, c.getExamInEditMode);
// router.get('/answerKey/:id', v.isValidMongooseId(), c.getAnswerKey);

/**
 * Update
 */

/* TODO add validation such that only examiner who had created the exam
 should be able to call this endpoint */
router.patch('/examDetails', v.updateExamDetailsValidation(), v.isExaminer, c.updateExamDetails, cachingMiddleware.revokeCachedResponses);

module.exports = router;
