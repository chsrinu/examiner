const { examService } = include('server/src/modules/exam/services');
const { enums } = include('server/src/helpers');

const { HTTP_STATUS_CODES } = enums;

const examController = {
  async createExam(req, res, next) {
    try {
      res.send(await examService.createExam(req.body));
    } catch (err) {
      next(err);
    }
  },
  async getExamById(req, res, next) {
    try {
      const { id } = req.params;
      res.send(await examService.getExamById(id), true);
    } catch (err) {
      next(err);
    }
  },
  async getExamByName(req, res, next) {
    try {
      const { examinerEmail, examName } = req.query;
      res.send(await examService.getExamByName(examinerEmail, examName), true);
    } catch (err) {
      next(err);
    }
  },
  // TODO make sure this end point is only accessible to the examiner who created this exam
  async getExamInEditMode(req, res, next) {
    try {
      const { id } = req.params;
      res.send(await examService.getExamByIdFromDb(id));
    } catch (err) {
      next(err);
    }
  },
  // async getAnswerKey(req, res, next) {
  //   try {
  //     const { id } = req.params;
  //     res.status(HTTP_STATUS_CODES.SUCCESS_200).send(await examService.getAnswerKey(id));
  //   } catch (err) {
  //     next(err);
  //   }
  // },
  async submitAnswers(req, res, next) {
    try {
      const { id, answers } = req.body;
      res.send({ score: await examService.getResult(id, answers) });
    } catch (err) {
      next(err);
    }
  },
  // TODO make sure this end point is only accessible to the examiner who created this exam
  async updateExamDetails(req, res, next) {
    try {
      const { examId, updates } = req.body;
      const oldExamName = await examService.updateExamDetails(examId, updates);
      res.locals.examName = oldExamName;
      res.status(HTTP_STATUS_CODES.SUCCESS_200);
      next();
    } catch (err) {
      next(err);
    }
  },
  // async addQuestion(req, res, next) {
  //   try {
  //     const { examId, question } = req.body;
  //     await examService.addQuestion(examId, question);
  //     res.status(HTTP_STATUS_CODES.SUCCESS_200);
  //   } catch (err) {
  //     next(err);
  //   }
  // },
  // async addOption(req, res, next) {
  //   try {
  //     const { examId, questionId, option } = req.body;
  //     await examService.addOption(examId, questionId, option);
  //     res.status(HTTP_STATUS_CODES.SUCCESS_200);
  //   } catch (err) {
  //     next(err);
  //   }
  // },
  // async updateQuestions(req, res, next) {
  //   try {
  //     const { examId, updates } = req.body;
  //     await examService.updateQuestions(examId, updates);
  //     res.status(HTTP_STATUS_CODES.SUCCESS_200);
  //   } catch (err) {
  //     next(err);
  //   }
  // },
  // async updateOptions(req, res, next) {
  //   try {
  //     const { examId, updates } = req.body;
  //     await examService.updateOptions(examId, updates);
  //     res.status(HTTP_STATUS_CODES.SUCCESS_200);
  //   } catch (err) {
  //     next(err);
  //   }
  // },
  // async updateAnswers(req, res, next) {
  //   try {
  //     const {
  //       examId, questionId, markAsAnswers, unMarkAsAnswers,
  //     } = req.body;
  //     await examService.updateAnswers(examId, questionId, markAsAnswers, unMarkAsAnswers);
  //     res.status(HTTP_STATUS_CODES.SUCCESS_200);
  //   } catch (err) {
  //     next(err);
  //   }
  // },
  // async deleteQuestion(req, res, next) {
  //   try {
  //     const { examId, questionId } = req.body;
  //     await examService.deleteQuestionById(examId, questionId);
  //     res.status(HTTP_STATUS_CODES.SUCCESS_200);
  //   } catch (err) {
  //     next(err);
  //   }
  // },
  // async deleteOption(req, res, next) {
  //   try {
  //     const { examId, questionId, optionId } = req.body;
  //     await examService.deleteOptionById(examId, questionId, optionId);
  //     res.status(HTTP_STATUS_CODES.SUCCESS_200);
  //   } catch (err) {
  //     next(err);
  //   }
  // },
  async cloneExam(req, res, next) {
    try {
      const { examId } = req.body;
      res.send(await examService.cloneExam(examId));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = examController;
