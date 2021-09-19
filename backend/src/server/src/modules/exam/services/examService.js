/* eslint-disable default-case */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */

const mongoose = require('mongoose');

const { ExamModel } = include('server/src/modules/exam/data-models');
const { examDtoToEntity } = include('server/src/modules/exam/converters');
const { enums, LruCache, error } = include('server/src/helpers');
const { userService } = include('server/src/modules/user/services');

const { HTTP_STATUS_CODES, QUESTION_TYPES } = enums;
const { ErrorHandler } = error;
const examCacheAltKeyGenerator = (exam) => {
  if (exam.examiner) {
    return `${exam.examiner.email}_${exam.name}`;
  }
  return null;
};
const examCache = new LruCache('ExamCache', process.env.EXAM_LRU_CACHE_SIZE, examCacheAltKeyGenerator);
const answerKeyCache = new LruCache('AnswersCache', process.env.EXAM_LRU_CACHE_SIZE);

const examService = {
  async createExam(examDetailsDto) {
    const examEntity = await examDtoToEntity(examDetailsDto);
    const savedExam = await examEntity.save();
    return savedExam;
  },
  async getExamByName(examinerEmail, examName) {
    let exam = examCache.get(`${examinerEmail}_${examName}`);
    if (!exam) {
      const user = await userService.findUserByEmailId(examinerEmail);
      if (user) {
        exam = await ExamModel.findOne({
          name: examName,
          examiner: mongoose.Types.ObjectId(user._id),
        }, '-questions.options.isAnswer -__v').populate('examiner', 'email firstName lastName -_id');
      }
      if (!exam) throw new ErrorHandler(HTTP_STATUS_CODES.NOT_FOUND_404, `Exam with name ${examName} and examiner email ${examinerEmail} does not exist`);
      examCache.set(exam._id, exam);
    }
    return exam;
  },
  async getExamById(id) {
    let exam = examCache.get(id);
    if (!exam) {
      exam = await ExamModel.findById(id, '-questions.options.isAnswer -__v')
        .populate('examiner', 'email firstName lastName -_id');
      if (!exam) {
        throw new ErrorHandler(HTTP_STATUS_CODES.NOT_FOUND_404, `Exam with id ${id} does not exist`);
      }
      examCache.set(id, exam);
    }
    return exam;
  },
  async getExamByIdFromDb(id) {
    const exam = await ExamModel.findById(id);
    if (!exam) {
      throw new ErrorHandler(HTTP_STATUS_CODES.NOT_FOUND_404, `Exam with id ${id} does not exist`);
    }
    return exam;
  },
  async getAnswerKey(examId) {
    let answerKey = answerKeyCache.get(examId);
    if (!answerKey) {
      answerKey = await ExamModel.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(examId),
          },
        },
        { $unwind: '$questions' },
        { $unwind: '$questions.options' },
        { $match: { 'questions.options.isAnswer': true } },
        {
          $group: {
            _id: '$questions._id',
            answers: {
              $push: { id: '$questions.options._id', value: '$questions.options.optionValue' },
            },
          },
        },
      ]);
      if (answerKey) answerKeyCache.set(examId, answerKey);
    }
    return answerKey;
  },
  async getResult(id, submittedAnswers) {
    const answerKeys = await this.getAnswerKey(id);
    let result = 0;
    if (answerKeys && answerKeys.length > 0) {
      answerKeys.forEach((answerKey) => {
        const submittedAnswer = submittedAnswers[answerKey._id];
        if (submittedAnswer) {
          if (submittedAnswer.length === answerKey.answers.length) {
            if (submittedAnswer.length > 1) {
              const dbAnswers = answerKey.answers.map((dbAns) => String(dbAns.id));
              const isCorrect = submittedAnswer.map((ans) => ans.id)
                .every((userAnsId) => dbAnswers.includes(userAnsId));
              if (isCorrect) result++;
            } else if (submittedAnswer[0].id) {
              if (submittedAnswer[0].id === String(answerKey.answers[0].id)) result++;
            } else if (submittedAnswer[0].value) {
              if (submittedAnswer[0].value === answerKey.answers[0].value) result++;
            }
          }
        }
      });
    }
    return result;
  },
  async updateExamDetails(examId, updates) {
    const exam = await this.getExamByIdFromDb(examId);
    const examName = exam.name;
    if (updates.name) {
      exam.name = updates.name;
    }
    if (updates.maxMarks) {
      exam.maxMarks = updates.maxMarks;
    }
    if (updates.durationInMins) {
      exam.durationInMins = updates.durationInMins;
    }
    if (updates.examTakerCategory) {
      exam.examTakerCategory = updates.examTakerCategory;
    }
    /** Existing question updates
    * updating a question means there can be
    * question/option value update
    * add/remove options
    * answer updates (marking new answers or unmarking current answers)
    * Updating a QUESTION_TYPE is not allowed, better let the user know to
    * remove this question and add a new question with intended questionType.
    * */
    if (updates.questions) {
      updates.questions.forEach((question) => this.updateQuestions(exam, question));
    }
    /** New questions to be added */
    if (updates.newQuestions) {
      updates.newQuestions.forEach((question) => this.addQuestion(exam, question));
    }
    /** Delete questions */
    if (updates.deleteQuestions) {
      updates.deleteQuestions.forEach((questionId) => this.deleteQuestion(exam, questionId));
    }
    await exam.save();
    this.clearCaches(true, true, examId);
    return examName;
  },
  updateQuestions(exam, questionUpdates) {
    const savedQuestion = this.getQuestionById(exam, questionUpdates.id);
    if (questionUpdates.newValue) {
      this.updateQuestion(questionUpdates, savedQuestion);
    }
    if (questionUpdates.options) {
      this.updateOptions(questionUpdates.options, savedQuestion);
    }
    if (questionUpdates.newOptions) {
      this.addOptions(questionUpdates.newOptions, savedQuestion);
    }
    if (questionUpdates.deleteOptions) {
      this.deleteOptions(questionUpdates.deleteOptions, savedQuestion);
    }
    if (questionUpdates.answers) {
      this.updateAnswers(questionUpdates.answers.markAnswers,
        questionUpdates.answers.unmarkAnswers,
        savedQuestion);
    }
  },
  addQuestion(exam, questionObj) {
    const { question, type, options } = questionObj;
    exam.questions.push({ question, type, options });
  },
  updateQuestion(questionUpdates, savedQuestion) {
    const { newValue } = questionUpdates;
    savedQuestion.question = newValue;
  },
  deleteQuestion(exam, questionId) {
    const questionIndex = exam.questions.map((q) => q._id).indexOf(questionId);
    if (questionIndex >= 0) exam.questions.splice(questionIndex, 1);
  },
  addOptions(newOptions, savedQuestion) {
    newOptions.forEach((newOption) => {
      const { isAnswer, optionValue } = newOption;
      savedQuestion.options.push({ optionValue, isAnswer });
    });
  },
  updateOptions(optionUpdates, savedQuestion) {
    for (let i = 0; i < optionUpdates.length; i++) {
      const { id, newValue } = optionUpdates[i];
      const option = this.getOptionById(savedQuestion, id);
      option.optionValue = newValue;
    }
  },
  deleteOptions(deleteOptions, savedQuestion) {
    deleteOptions.forEach((optionId) => {
      const optionIndex = savedQuestion.options.map((o) => o._id).indexOf(optionId);
      if (optionIndex >= 0) savedQuestion.options.splice(optionIndex, 1);
    });
    let isValid = true;
    const optionsLength = savedQuestion.options.length;
    switch (savedQuestion.type) {
      case QUESTION_TYPES[0]:
      case QUESTION_TYPES[1]: if (optionsLength < 3 || optionsLength > 5) isValid = false; break;
      case QUESTION_TYPES[2]: if (savedQuestion.options.length !== 1) isValid = false; break;
      case QUESTION_TYPES[3]: if (savedQuestion.options.length !== 2) isValid = false; break;
    }
    if (!isValid) {
      throw new ErrorHandler(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY_422, 'Update failed: Min/Max options for QuestionType validation fails');
    }
  },
  /* Changes the existing answer to newOne if QuestionType is not
  MULTIPLE_CHOICE_QUESTION_WITH_MULTIPLE_ANSWERS by resetting isAnswer of existing answer to false.
  If QuestionType is MULTIPLE_CHOICE_QUESTION_WITH_MULTIPLE_ANSWERS then change the isAnswer
  attribute of the newAnswer option to true no need to reset others. */
  updateAnswers(markAnswers, unmarkAnswers, savedQuestion) {
    if (savedQuestion.type !== QUESTION_TYPES[1] && markAnswers) {
      savedQuestion.options.forEach((o) => {
        if (markAnswers.indexOf(String(o._id)) >= 0) o.isAnswer = true;
        else o.isAnswer = false;
      });
    } else if (markAnswers && unmarkAnswers) {
      savedQuestion.options.forEach((o) => {
        if (markAnswers.indexOf(String(o._id)) >= 0) o.isAnswer = true;
        else if (unmarkAnswers.indexOf(String(o._id)) >= 0) o.isAnswer = false;
      });
    } else if (markAnswers) {
      savedQuestion.options.forEach((o) => {
        if (markAnswers.indexOf(String(o._id)) >= 0) o.isAnswer = true;
      });
    } else if (unmarkAnswers) {
      savedQuestion.options.forEach((o) => {
        if (unmarkAnswers.indexOf(String(o._id)) >= 0) o.isAnswer = false;
      });
    } else {
      return;
    }
    this.validateOptionsAfterAnswersUpdate(savedQuestion.options, savedQuestion.type);
  },
  validateOptionsAfterAnswersUpdate(options, questionType) {
    if (questionType === QUESTION_TYPES[1]) {
      const expectedMinAnswersCount = 2;
      let answerCount = 0;
      options.forEach((o) => { if (o.isAnswer) answerCount++; });
      if (answerCount < expectedMinAnswersCount) {
        throw new ErrorHandler(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY_422, 'Update failed: Min answer count validation fails');
      }
    } else {
      const expectedAnswersCount = 1;
      let answerCount = 0;
      let errorMessage;
      options.forEach((o) => { if (o.isAnswer) answerCount++; });
      if (answerCount < expectedAnswersCount) {
        errorMessage = 'Update failed: Min answer count validation fails';
      } else if (answerCount > expectedAnswersCount) {
        errorMessage = 'Update failed: Max answer count validation fails';
      }
      if (answerCount !== expectedAnswersCount) {
        throw new ErrorHandler(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY_422, errorMessage);
      }
    }
  },
  getQuestionById(exam, questionId) {
    const question = exam.questions.find((q) => q._id.equals(questionId));
    if (!question) {
      throw new ErrorHandler(HTTP_STATUS_CODES.NOT_FOUND_404, `Question with id ${questionId} does not exist`);
    }
    return question;
  },
  getOptionById(question, optionId) {
    const option = question.options.find((o) => o._id.equals(optionId));
    if (!option) {
      throw new ErrorHandler(HTTP_STATUS_CODES.NOT_FOUND_404, `Option with id ${optionId} does not exist`);
    }
    return option;
  },
  clearCaches(entryInQuestionCache, entryInAnswerCache, examId) {
    if (entryInQuestionCache) {
      examCache.deleteEntry(examId);
    }
    if (entryInAnswerCache) {
      answerKeyCache.deleteEntry(examId);
    }
  },
  async cloneExam(examId) {
    const ignoreFields = '-__v -examiner -_id -questions._id -questions.options._id -createdDate';
    const examClone = await ExamModel.findById(examId, ignoreFields);
    return examClone;
  },
  getExamCache() {
    return examCache;
  },
  getAnswerCache() {
    return answerKeyCache;
  },
};

module.exports = examService;
