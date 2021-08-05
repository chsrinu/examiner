/* eslint-disable no-param-reassign */
/* eslint-disable default-case */
/* eslint-disable no-plusplus */
const mongoose = require('mongoose');
const { check, body, validationResult } = require('express-validator');

const { examService } = include('server/src/modules/exam/services');
const { userService } = include('server/src/modules/user/services');

const logger = include('server/src/helpers/logger')(__filename);

const {
  HTTP_STATUS_CODES, EXAM_ERRORS, EXAMTAKER_CATEGORY, QUESTION_TYPES,
} = include('server/src/helpers/enums');

const { ErrorHandler } = include('server/src/helpers/error');

const newExamKeys = [
  'name',
  'examinerEmail',
  'durationInMins',
  'maxMarks',
  'examTakerCategory',
  'questions',
];
const questionKeys = [
  'question',
  'type',
  'options',
];
const optionKeys = [
  'optionValue',
  'isAnswer',
];

const examByNameKeys = [
  'examinerEmail',
  'examName',
];

const examUpdateKeys = [
  'examId',
  'updates',
];

const updateAnswerKeys = [
  'markAnswers',
  'unmarkAnswers',
];

const submitAnswerKeys = [
  'id',
  'answers',
];

const validator = {
  // eslint-disable-next-line consistent-return
  async isExaminer(req, res, next) {
    // get the user email from authToken
    // get the examDetails using examId/mongooseId
    const userEmail = req.user.email;
    const examId = req.body.examId ? req.body.examId : req.params.id;
    const exam = await examService.getExamById(examId);
    const examinerEmail = exam ? exam.examiner.email : null;
    if (userEmail !== examinerEmail) {
      next(new ErrorHandler(HTTP_STATUS_CODES.FORBIDDEN_403, 'Unauthorized'));
    }
    next();
  },
  newQuestionPropertiesValidation(value) {
    value.forEach((q, index) => {
      if (!q.type) throw new Error(`Missing QuestionType @ index ${index} in array`);
      if (!q.question) throw new Error(`Missing question passed @ index ${index} in array`);

      /**  Options validation
       * Options type check validation
       * OptionLength validation check based on questionType
       * OptionValue type check and length check
       * MinAnswerCount validation check
      */
      if (!q.options) throw new Error(`Missing options array @ index ${index} in array`);
      this.optionLengthValidationBasedOnQuestionType(q.type, q.options, index);
      this.minAnswerCountValidation(q.type, q.options, index);
    });
    return true;
  },
  optionLengthValidationBasedOnQuestionType(type, options, index) {
    const optionsLength = options.length;
    let isOptionsLengthValid = true;
    let invalidLengthErrorMessage = '';
    switch (type) {
      case QUESTION_TYPES[0]:
      case QUESTION_TYPES[1]: if (optionsLength < 3 || optionsLength > 5) {
        isOptionsLengthValid = false;
        invalidLengthErrorMessage = `Options array length should be between 3 and 5 for question @ index ${index}`;
      }
        break;
        // TODO option should be hidden for this questionType before sending the questionPaper
      case QUESTION_TYPES[2]: if (optionsLength !== 1) {
        isOptionsLengthValid = false;
        invalidLengthErrorMessage = `Options array length should be 1 for question @ index ${index}`;
      }
        break;
      case QUESTION_TYPES[3]: if (optionsLength !== 2) {
        isOptionsLengthValid = false;
        invalidLengthErrorMessage = `Options array length should be 2 for question @ index ${index}`;
      }
        break;
    }
    if (!isOptionsLengthValid) throw new Error(invalidLengthErrorMessage);
  },
  minAnswerCountValidation(type, options, index) {
    let answerCount = 0;
    const expectedMinAnswersCount = type === QUESTION_TYPES[1] ? 2 : 1;
    if (options) {
      options.forEach((o, oIndex) => {
        if (!o.optionValue) throw new Error(`Missing optionValue @ position ${oIndex} in options array under question @ index ${index}`);
        if (o.isAnswer && typeof o.isAnswer === 'boolean') answerCount++;
      });
    }
    if (answerCount !== expectedMinAnswersCount) {
      if (!(answerCount > expectedMinAnswersCount && type === QUESTION_TYPES[1])) throw new Error(`Min answers count validation fails for question @ index ${index}`);
    }
  },
  createExamValidations() {
    return [
      check(newExamKeys[0])
        .exists()
        .withMessage(EXAM_ERRORS.EXAM_NAME_MISSING)
        .trim()
        .escape()
        .isLength({ min: 3, max: 16 })
        .withMessage(EXAM_ERRORS.EXAM_NAME_LENGTH_VALIDATION_FAILURE)
        .custom(async (value, { req }) => {
          let exam;
          try {
            exam = await examService.getExamByName(req.body.examinerEmail, value);
          } catch (err) {
            logger.info(`Exam with give name and examiner email returned ${err.msg}`);
          }
          if (exam) throw new Error('Exam with this name has already been created by you, please try a different name');
          else return true;
        }),
      check(newExamKeys[1])
        .exists()
        .withMessage(EXAM_ERRORS.EXAMINER_EMAIL_MISSING)
        .trim()
        .escape()
        .normalizeEmail()
        .isEmail()
        .withMessage(EXAM_ERRORS.INVALID_EXAMINER_EMAIL),
      check(newExamKeys[2])
        .exists()
        .withMessage(EXAM_ERRORS.EXAM_DURATION_MISSING)
        .trim()
        .isInt()
        .withMessage(EXAM_ERRORS.INVALID_NUMBER_IN_EXAM_DURATION),
      check(newExamKeys[3])
        .exists()
        .withMessage(EXAM_ERRORS.EXAM_MARKS_MISSING)
        .trim()
        .isInt()
        .withMessage(EXAM_ERRORS.INVALID_NUMBER_IN_EXAM_MARKS),
      check(newExamKeys[4])
        .exists()
        .withMessage(EXAM_ERRORS.EXAMTAKER_CATEGORY_MISSING)
        .trim()
        .toUpperCase()
        .isIn(EXAMTAKER_CATEGORY),
      check('questions.*.question')
        .if((value) => value)
        .isString()
        .withMessage(EXAM_ERRORS.EXPECTED_STRING)
        .trim()
        .isLength({ min: 5, max: 600 })
        .withMessage(EXAM_ERRORS.QUESTION_LENGTH_VALIDATION_FAILURE),
      check('questions.*.type')
        .if((value) => value)
        .trim()
        .toUpperCase()
        .isIn(QUESTION_TYPES)
        .withMessage(EXAM_ERRORS.INVALID_QUESTION_TYPE),
      check('questions.*.options')
        .if((value) => value)
        .isArray()
        .withMessage(EXAM_ERRORS.EXPECTED_ARRAY)
        .notEmpty()
        .withMessage(EXAM_ERRORS.EMPTY_ARRAY),
      check('questions.*.options.*.optionValue')
        .if((value) => value)
        .isString()
        .withMessage(EXAM_ERRORS.EXPECTED_STRING)
        .trim()
        .toLowerCase()
        .isLength({ min: 1, max: 150 })
        .withMessage(EXAM_ERRORS.OPTION_LENGTH_VALIDATION_FAILURE),
      check('questions.*.options.*.isAnswer')
        .if((value) => value)
        .isBoolean()
        .withMessage(EXAM_ERRORS.EXPECTED_BOOLEAN),
      check(newExamKeys[5])
        .if((value) => value)
        .isArray()
        .withMessage(EXAM_ERRORS.EXPECTED_ARRAY)
        .notEmpty()
        .withMessage(EXAM_ERRORS.EMPTY_ARRAY)
        .custom((value) => this.newQuestionPropertiesValidation(value)),
      /**
      *Custom validation for extra or missing params in request Body
      */
      body().custom((reqBody) => {
        let isQuestionsArrayValid = true;
        let errMessage;
        const isValidBody = Object.keys(reqBody).every((prop) => newExamKeys.includes(prop));
        if (isValidBody && reqBody.questions) {
          isQuestionsArrayValid = reqBody.questions.every(
            (q) => Object.keys(q).every((prop) => questionKeys.includes(prop))
            && q.options.every((o) => Object.keys(o).every((prop) => optionKeys.includes(prop))),
          );
        }
        if (!isValidBody || !isQuestionsArrayValid) {
          if (!isValidBody) {
            errMessage = 'Request body has some missing/invalid properties, please check and try again';
          } else {
            errMessage = 'Questions array inside request body has some missing/invalid props, please check and try again';
          }
          throw new Error(errMessage);
        }
        return true;
      }),
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
  isMongooseIdValid(id) {
    return mongoose.Types.ObjectId.isValid(id);
  },
  getExamByNameValidations() {
    return [
      check(examByNameKeys[0])
        .exists()
        .withMessage(EXAM_ERRORS.EXAMINER_EMAIL_MISSING)
        .trim()
        .escape()
        .normalizeEmail()
        .isEmail()
        .withMessage(EXAM_ERRORS.INVALID_EXAMINER_EMAIL)
        .custom(async (value) => {
          const user = await userService.findUserByEmailId(value);
          if (!user) throw new Error('Examiner email is not registered');
          return true;
        }),
      check(examByNameKeys[1])
        .exists()
        .withMessage(EXAM_ERRORS.EXAM_NAME_MISSING)
        .trim()
        .escape()
        .isLength({ min: 3, max: 16 })
        .withMessage(EXAM_ERRORS.EXAM_NAME_LENGTH_VALIDATION_FAILURE),
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
  isValidMongooseId() {
    return [
      check('id')
        .custom((value) => this.isMongooseIdValid(value))
        .withMessage(EXAM_ERRORS.INVALID_EXAM_ID),
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
  updateExamDetailsValidation() {
    return [
      check(examUpdateKeys[0])
        .exists()
        .withMessage(EXAM_ERRORS.INVALID_EXAM_ID)
        .custom((value) => {
          if (!mongoose.Types.ObjectId.isValid(value)) throw new Error(EXAM_ERRORS.INVALID_EXAM_ID);
          return true;
        }),
      check('updates.name')
        .if((value) => value)
        .trim()
        .escape()
        .isLength({ min: 3, max: 16 })
        .withMessage(EXAM_ERRORS.EXAM_NAME_LENGTH_VALIDATION_FAILURE)
        .custom(async (value, { req }) => {
          let exam;
          try {
            exam = await examService.getExamByName(req.body.examinerEmail, value);
          } catch (err) {
            logger.info(err.msg);
          }
          if (exam) throw new Error('Exam with this name has already been created by you, please try a different name');
          else return true;
        }),
      check('updates.maxMarks')
        .if((value) => value)
        .trim()
        .isInt()
        .withMessage(EXAM_ERRORS.INVALID_NUMBER_IN_EXAM_MARKS),
      check('updates.durationInMins')
        .if((value) => value)
        .trim()
        .isInt()
        .withMessage(EXAM_ERRORS.INVALID_NUMBER_IN_EXAM_DURATION),
      check('updates.examTakerCategory')
        .if((value) => value)
        .trim()
        .toUpperCase()
        .isIn(EXAMTAKER_CATEGORY),
      check(['updates.questions',
        'updates.questions.*.options',
        'updates.questions.*.newOptions',
        'updates.newQuestions',
        'updates.newQuestions.*.options',
      ])
        .if((value) => value)
        .isArray()
        .withMessage(EXAM_ERRORS.EXPECTED_ARRAY)
        .notEmpty()
        .withMessage(EXAM_ERRORS.EMPTY_ARRAY),
      check(['updates.questions.*.id', 'updates.questions.*.options.*.id'])
        .if((value) => value)
        .custom((value) => this.isMongooseIdValid(value))
        .withMessage(EXAM_ERRORS.INVALID_EXAM_ID),
      check(['updates.questions.*.newValue', 'updates.newQuestions.*.question'])
        .if((value) => value)
        .isString()
        .withMessage(EXAM_ERRORS.EXPECTED_STRING)
        .trim()
        .isLength({ min: 5, max: 600 })
        .withMessage(EXAM_ERRORS.QUESTION_LENGTH_VALIDATION_FAILURE),
      check(['updates.questions.*.options.*.newValue',
        'updates.questions.*.newOptions.*.optionValue',
        'updates.newQuestions.*.options.*.optionValue',
      ])
        .if((value) => value)
        .isString()
        .withMessage(EXAM_ERRORS.EXPECTED_STRING)
        .trim()
        .toLowerCase()
        .isLength({ min: 1, max: 150 })
        .withMessage(EXAM_ERRORS.OPTION_LENGTH_VALIDATION_FAILURE),
      check(['updates.questions.*.newOptions.*.isAnswer',
        'updates.newQuestions.*.options.*.isAnswer',
      ])
        .if((value) => value)
        .isBoolean()
        .withMessage(EXAM_ERRORS.EXPECTED_BOOLEAN),
      check('updates.questions.answers')
        .if((value) => value)
        .custom((value) => Object.keys(value) > 0)
        .withMessage(EXAM_ERRORS.EMPTY_OBJECT),
      check(['updates.questions.*.deleteOptions',
        'updates.questions.*.answers.markAnswers',
        'updates.questions.*.answers.unmarkAnswers',
        'updates.deleteQuestions',
      ])
        .if((value) => value)
        .isArray()
        .withMessage(EXAM_ERRORS.EXPECTED_ARRAY)
        .notEmpty()
        .withMessage(EXAM_ERRORS.EMPTY_ARRAY)
        .custom((value) => value.every((id) => this.isMongooseIdValid(id)))
        .withMessage(EXAM_ERRORS.INVALID_EXAM_ID),
      check('updates.newQuestions.*.type')
        .if((value) => value)
        .isIn(QUESTION_TYPES)
        .withMessage(EXAM_ERRORS.INVALID_QUESTION_TYPE),
      check(examUpdateKeys[1])
        .exists()
        .withMessage(EXAM_ERRORS.MISSING_UPDATES_ELEMENT)
        .custom((value) => Object.keys(value).length > 0)
        .withMessage(EXAM_ERRORS.EMPTY_OBJECT)
        .custom((value) => {
          // checks for combinations i.e updates which cannot be performed without other objects
          if (value.questions) {
            value.questions.forEach((q, index) => {
              if (!q.id) throw new Error(EXAM_ERRORS.INVALID_EXAM_ID);
              if (Object.keys(q).length < 2) throw new Error(EXAM_ERRORS.UPDATES_MISSING);
              // options cannot be updated without id and newValue if any one of them is not sent
              // or undefined then we cannot update the other so throw a validation error.
              if (q.options) {
                q.options.forEach((o) => {
                  if (!o.id || !o.newValue) {
                    throw new Error(EXAM_ERRORS.INVALID_OPTIONS_UPDATE);
                  }
                });
              }
              if (q.newOptions) {
                q.newOptions.forEach((o) => {
                  const keys = Object.keys(o);
                  if (keys.length < 1) throw new Error(EXAM_ERRORS.EMPTY_OBJECT);
                  if (!keys.every((key) => optionKeys.includes(key))) {
                    throw new Error(EXAM_ERRORS.INVALID_PROPERTIES_FOUND);
                  }
                  if (o.isAnswer && !(o.optionValue)) throw new Error(`optionValue property missing with isAnswer @ index ${index} in questions update`);
                });
              }
              if (q.answers) {
                const keys = Object.keys(q.answers);
                if (keys.length < 1) throw new Error(EXAM_ERRORS.EMPTY_OBJECT);
                if (!keys.every((key) => updateAnswerKeys.includes(key))) {
                  throw new Error(EXAM_ERRORS.INVALID_PROPERTIES_FOUND);
                }
              }
            });
          }
          if (value.newQuestions) {
            this.newQuestionPropertiesValidation(value.newQuestions);
          }
          return true;
        }),
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
  submitAnswersValidations() {
    return [
      check(submitAnswerKeys[0])
        .exists()
        .withMessage(EXAM_ERRORS.INVALID_EXAM_ID)
        .custom((value) => this.isMongooseIdValid(value))
        .withMessage(EXAM_ERRORS.INVALID_EXAM_ID),
      check(submitAnswerKeys[1])
        .exists()
        .withMessage(EXAM_ERRORS.MISSING_ANSWERS_OBJECT)
        .isObject()
        .withMessage(EXAM_ERRORS.EXPECTED_OBJECT)
        .custom((value) => {
          const questionIds = Object.keys(value);
          if (!questionIds.every((id) => this.isMongooseIdValid(id))) throw new Error(`${EXAM_ERRORS.INVALID_EXAM_ID} as key`);
          questionIds.forEach((qId, index) => {
            const options = value[qId];
            options.forEach((option) => {
              if (!option.id && !option.value) throw new Error(EXAM_ERRORS.MISSING_MANDATORY_PROPS);
              if (option.id && !this.isMongooseIdValid(option.id)) throw new Error(`${EXAM_ERRORS.INVALID_EXAM_ID} for id @ index ${index} in options array`);
              if (option.value) {
                if (typeof option.value !== 'string') throw new Error(`${EXAM_ERRORS.EXPECTED_STRING} for value @ index ${index} in answer array`);
                const optionValue = option.value.trim();
                if (optionValue.length > 150 || optionValue.length < 1) throw new Error(EXAM_ERRORS.OPTION_LENGTH_VALIDATION_FAILURE);
              }
            });
          });
          return true;
        }),
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
};

module.exports = validator;
