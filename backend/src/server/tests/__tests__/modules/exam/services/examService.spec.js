/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
require('../../../../../globals/fileImportWrapper');

const dbService = include('server/tests/dbService');
const { HTTP_STATUS_CODES } = include('server/src/helpers/enums');
const { examService } = include('server/src/modules/exam/services');
const { ExamModel } = include('server/src/modules/exam/data-models');
const { UserModel } = include('server/src/modules/user/data-models');
const { userService } = include('server/src/modules/user/services');

const validUser = {
  email: 'test56@gmail.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};
const validUser1 = {
  email: 'test57@gmail.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

const validUser2 = {
  email: 'test58@gmail.com',
  password: 'abcdefgh',
  firstName: 'cde',
  lastName: 'eaasasda',
};

const reqBody = {
  name: 'test1',
  examinerEmail: 'test56@gmail.com',
  durationInMins: 20,
  maxMarks: 25,
  createdDate: Date.now(),
  questions: [
    {
      type: 'MULTIPLE_CHOICE_QUESTION_WITH_SINGLE_ANSWER',
      question: 'How old are you?',
      options: [
        {
          optionValue: '16',
        },
        {
          optionValue: '17',
          isAnswer: true,
        },
        {
          optionValue: '18',
        },
        {
          optionValue: '18',
        },
      ],
    },
    {
      type: 'MULTIPLE_CHOICE_QUESTION_WITH_MULTIPLE_ANSWERS',
      question: 'Whats your name?',
      options: [
        {
          optionValue: 'Abc',
        },
        {
          optionValue: 'def',
          isAnswer: true,
        },
        {
          optionValue: 'sreeni',
          isAnswer: true,
        },
        {
          optionValue: 'jkl',
        },
      ],
    },
    {
      type: 'TRUE_OR_FALSE',
      question: 'Avengers are real?',
      options: [
        {
          optionValue: 'true',
        },
        {
          optionValue: 'false',
          isAnswer: true,
        },
      ],
    },
  ],
};

const reqBody1 = {
  name: 'test1',
  examinerEmail: 'test57@gmail.com',
  durationInMins: 20,
  maxMarks: 25,
  createdDate: Date.now(),
  questions: [
    {
      type: 'MULTIPLE_CHOICE_QUESTION_WITH_SINGLE_ANSWER',
      question: 'How old is your mother?',
      options: [
        {
          optionValue: '16',
          isAnswer: true,
        },
        {
          optionValue: '17',
          isAnswer: true,
        },
        {
          optionValue: '18',
        },
        {
          optionValue: '19',
        },
      ],
    },
    {
      type: 'MULTIPLE_CHOICE_QUESTION_WITH_MULTIPLE_ANSWERS',
      question: 'Whats your nickname?',
      options: [
        {
          optionValue: 'Abc',
        },
        {
          optionValue: 'def',
        },
        {
          optionValue: 'sreeni',
          isAnswer: true,
        },
        {
          optionValue: 'jkl',
        },
      ],
    },
  ],
};

const reqBody2 = {
  name: 'test1',
  examinerEmail: 'test58@gmail.com',
  durationInMins: 20,
  maxMarks: 25,
  createdDate: Date.now(),
  questions: [
    {
      type: 'MULTIPLE_CHOICE_QUESTION_WITH_SINGLE_ANSWER',
      question: 'How old is your father?',
      options: [
        {
          optionValue: '16',
          isAnswer: true,
        },
        {
          optionValue: '17',
          isAnswer: true,
        },
        {
          optionValue: '18',
        },
        {
          optionValue: '19',
        },
      ],
    },
    {
      type: 'MULTIPLE_CHOICE_QUESTION_WITH_MULTIPLE_ANSWERS',
      question: 'wheres your hometown?',
      options: [
        {
          optionValue: 'Abc',
        },
        {
          optionValue: 'def',
        },
        {
          optionValue: 'sreeni',
          isAnswer: true,
        },
        {
          optionValue: 'jkl',
        },
      ],
    },
  ],
};

beforeAll(async () => {
  await dbService.connect();
});
beforeEach(async () => {
  await dbService.clearDatabase();
  const newUser = new UserModel(validUser);
  await newUser.save();
  examService.getExamCache().clear();
  userService.getUserCache().clear();
});
afterAll(async () => dbService.closeDatabase());

describe('ExamService testSuite', () => {
  describe('New Exam', () => {
    it('save with valid data', async () => {
      const savedExam = await examService.createExam(reqBody);
      expect(savedExam._id).not.toBeNull();
      const exam = await examService.getExamById(savedExam._id);
      expect(exam.examiner.email).toBe('test56@gmail.com');
    });

    it('retrieve saved exam', async () => {
      const examName = 'test1';
      await examService.createExam(reqBody);
      const savedExam = await examService.getExamByName('test56@gmail.com', examName);
      expect(savedExam).toBeDefined();
      expect(savedExam).not.toBeNull();
      const cache = examService.getExamCache();
      const examCachedById = cache.get(savedExam._id);
      const examCachedByAltkey = cache.get('test56@gmail.com_test1');
      expect(examCachedById).toEqual(savedExam);
      expect(examCachedById).toEqual(examCachedByAltkey);
    });
    it('retrieve saved exam with same examName but different creators', async () => {
      const examName = 'test1';
      const newUser = new UserModel(validUser1);
      await newUser.save();
      const newUser1 = new UserModel(validUser2);
      await newUser1.save();

      await examService.createExam(reqBody);
      await examService.createExam(reqBody1);
      await examService.createExam(reqBody2);
      const savedExam = await examService.getExamByName('test57@gmail.com', examName);
      expect(savedExam).toBeDefined();
      expect(savedExam).not.toBeNull();
      expect(savedExam.examiner.email).toBe('test57@gmail.com');
    });
    it('retrieve unsaved exam', async () => {
      let error;
      const examName = 'test2';
      let examinerEmail;
      try {
        await examService.getExamByName(examinerEmail, examName);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe(`Exam with name ${examName} and examiner email ${examinerEmail} does not exist`);
      expect(error.statusCode).toBe(HTTP_STATUS_CODES.NOT_FOUND_404);
    });
    it('get answerKey for savedExam', async () => {
      await examService.createExam(reqBody);
      const savedExam = await ExamModel.findOne({ name: 'test1' });
      const answerKey = await examService.getAnswerKey(savedExam._id);
      expect(answerKey).not.toBeNull();
      const answerForQuestion = answerKey
        .find((answer) => answer._id.equals(savedExam.questions[0]._id));
      const expectedAnswers = [];
      savedExam.questions[0].options.forEach((option) => {
        if (option.isAnswer) expectedAnswers.push(option._id);
      });
      expect(expectedAnswers).toEqual(answerForQuestion.answers);
    });
  });
  describe('Update exam', () => {
    it('update question', async () => {
      await examService.createExam(reqBody);
      const savedExam = await ExamModel.findOne({ name: 'test1' }, '-questions.options.isAnswer');
      const examId = savedExam._id;
      // const temp = await examService.getExamById(savedExam._id);
      // expect(temp).toEqual(savedExam);
      const questionId_1 = savedExam.questions[0]._id;
      const questionId_2 = savedExam.questions[1]._id;

      expect(savedExam.questions[0].question).toBe('How old are you?');
      const newValue_1 = 'How old is your brother?';
      expect(savedExam.questions[1].question).toBe('Whats your name?');
      const newValue_2 = 'Whats your nick name?';

      const updates = [];
      updates.push({ questionId: questionId_1, newValue: newValue_1 });
      updates.push({ questionId: questionId_2, newValue: newValue_2 });

      await examService.updateQuestions(examId, updates);
      const examUpdatedWithQuestion = await ExamModel.findOne({ name: 'test1' });
      expect(examUpdatedWithQuestion._id).toEqual(examId);
      expect(examUpdatedWithQuestion.questions[0].question).toBe(newValue_1);
      expect(examUpdatedWithQuestion.questions[1].question).toBe(newValue_2);
    });
    it('update question with invalid exam Ids', async () => {
      // await examService.createExam(reqBody);
      // const savedExam = await ExamModel.findOne({ name: 'test1' });
      let error;
      const examId = '60b86f40adabb41be14d6fd0';
      const questionId = '60b86f40adabb41be14d6fd1';
      // expect(savedExam.questions[0].question).toBe('How old are you?');
      const newValue = 'How old is your brother?';
      try {
        await examService.updateQuestions(examId, [{ questionId, newValue }]);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe(`Exam with id ${examId} does not exist`);
      expect(error.statusCode).toBe(HTTP_STATUS_CODES.NOT_FOUND_404);
    });
    it('update question with valid exam Id but invalidQuestionId', async () => {
      await examService.createExam(reqBody);
      const savedExam = await ExamModel.findOne({ name: 'test1' });
      const examId = savedExam._id;
      let error;
      const questionId = '60b86f40adabb41be14d6fd1';
      const newValue = 'How old is your brother?';
      try {
        await examService.updateQuestions(examId, [{ questionId, newValue }]);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe(`Question with id ${questionId} does not exist`);
      expect(error.statusCode).toBe(HTTP_STATUS_CODES.NOT_FOUND_404);
    });
    it('update option with valid Ids', async () => {
      await examService.createExam(reqBody);
      let savedExam = await ExamModel.findOne({ name: 'test1' });
      const examId = savedExam._id;

      const questionId_1 = savedExam.questions[0]._id;
      const optionId_1 = savedExam.questions[0].options[0]._id;
      expect(savedExam.questions[0].options[0].optionValue).toBe('16');
      const newValue_1 = '25';

      const questionId_2 = savedExam.questions[1]._id;
      const optionId_2 = savedExam.questions[1].options[0]._id;
      expect(savedExam.questions[1].options[0].optionValue).toBe('Abc');
      const newValue_2 = 'xyz';

      const updates = [];
      updates.push({ questionId: questionId_1, optionId: optionId_1, newValue: newValue_1 });
      updates.push({ questionId: questionId_2, optionId: optionId_2, newValue: newValue_2 });

      await examService.updateOptions(examId, updates);
      savedExam = await ExamModel.findOne({ name: 'test1' });
      expect(savedExam.questions[0].options[0].optionValue).toBe(newValue_1);
      expect(savedExam.questions[1].options[0].optionValue).toBe(newValue_2);
    });
    it('update option with invalid ExamId', async () => {
      let error;
      await examService.createExam(reqBody);
      const savedExam = await ExamModel.findOne({ name: 'test1' });
      const examId = '60b86f40adabb41be14d6fd1';
      const questionId = savedExam.questions[0]._id;
      const optionId = savedExam.questions[0].options[0]._id;
      const newValue = '25';
      try {
        await examService.updateOptions(examId, [{ questionId, optionId, newValue }]);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe(`Exam with id ${examId} does not exist`);
      expect(error.statusCode).toBe(HTTP_STATUS_CODES.NOT_FOUND_404);
    });
    it('update option with valid exam Id but invalidQuestionId', async () => {
      let error;
      await examService.createExam(reqBody);
      const savedExam = await ExamModel.findOne({ name: 'test1' });
      const examId = savedExam._id;
      const questionId = '60b86f40adabb41be14d6fd1';
      const optionId = savedExam.questions[0].options[0]._id;
      const newValue = '25';
      try {
        await examService.updateOptions(examId, [{ questionId, optionId, newValue }]);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe(`Question with id ${questionId} does not exist`);
      expect(error.statusCode).toBe(HTTP_STATUS_CODES.NOT_FOUND_404);
    });
    it('update option with valid examId,questionId but invalid optionId', async () => {
      let error;
      await examService.createExam(reqBody);
      const savedExam = await ExamModel.findOne({ name: 'test1' });
      const examId = savedExam._id;
      const questionId = savedExam.questions[0]._id;
      const optionId = '60b86f40adabb41be14d6fd1';
      const newValue = '25';
      try {
        await examService.updateOptions(examId, [{ questionId, optionId, newValue }]);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe(`Option with id ${optionId} does not exist`);
      expect(error.statusCode).toBe(HTTP_STATUS_CODES.NOT_FOUND_404);
    });
    it('Update answers for multiple choice question with single answer', async () => {
      await examService.createExam(reqBody);
      let savedExam = await ExamModel.findOne({ name: 'test1' });
      const examId = savedExam._id;
      const questionId = savedExam.questions[0]._id;
      const { options } = savedExam.questions[0];
      const answerOption = options[options.map((o) => o.isAnswer).indexOf(true)];
      expect(answerOption.optionValue).toBe('17');
      const newAnswerOption = options[options.map((o) => o.isAnswer).indexOf(false)];
      await examService.updateAnswers(examId, questionId, [String(newAnswerOption._id)]);
      savedExam = await ExamModel.findOne({ name: 'test1' });
      const updatedOptions = savedExam.questions[0].options;
      const updatedAnswerOption = updatedOptions[
        updatedOptions.map((o) => o.isAnswer).indexOf(true)
      ];
      expect(updatedAnswerOption.optionValue).toBe('16');
    });
    // MCQWSA - Multiple choice Question with Single Answer
    it('Min answers validation failure upon Update answers for MCQWSA', async () => {
      await examService.createExam(reqBody);
      let error;
      const savedExam = await ExamModel.findOne({ name: 'test1' });
      const examId = savedExam._id;
      const questionId = savedExam.questions[0]._id;
      const { options } = savedExam.questions[0];
      const answerOption = options[options.map((o) => o.isAnswer).indexOf(true)];
      expect(answerOption.optionValue).toBe('17');
      try {
        await examService.updateAnswers(examId, questionId, ['60b86f40adabb41be14d6fd1']);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Update failed: Min answer count validation fails');
      expect(error.statusCode).toBe(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY_422);
    });
    it('Max answers validation failure upon Update answers for MCQWSA', async () => {
      await examService.createExam(reqBody);
      let error;
      const savedExam = await ExamModel.findOne({ name: 'test1' });
      const examId = savedExam._id;
      const questionId = savedExam.questions[0]._id;
      const { options } = savedExam.questions[0];
      const markAnswers = [String(options[0]._id), String(options[2]._id)];
      try {
        await examService.updateAnswers(examId, questionId, markAnswers);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Update failed: Max answer count validation fails');
      expect(error.statusCode).toBe(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY_422);
    });
    // MCQWMA - Multiple Choice Questions With Multiple Answers
    it('Update answers for MCQWMA', async () => {
      await examService.createExam(reqBody);
      let savedExam = await ExamModel.findOne({ name: 'test1' });
      const examId = savedExam._id;
      const questionId = savedExam.questions[1]._id;
      let { options } = savedExam.questions[1];
      expect(options[1].isAnswer).toBeTruthy();
      expect(options[2].isAnswer).toBeTruthy();
      expect(options[0].isAnswer).toBeFalsy();
      expect(options[3].isAnswer).toBeFalsy();
      const markAnswers = [String(options[0]._id), String(options[3]._id)];
      const unMarkAnswers = [String(options[1]._id), String(options[2]._id)];
      await examService.updateAnswers(examId, questionId, markAnswers, unMarkAnswers);
      savedExam = await ExamModel.findOne({ name: 'test1' });
      options = savedExam.questions[1].options;
      expect(options[0].isAnswer).toBeTruthy();
      expect(options[3].isAnswer).toBeTruthy();
      expect(options[1].isAnswer).toBeFalsy();
      expect(options[2].isAnswer).toBeFalsy();
    });
    // MCQWMA - Multiple Choice Questions With Multiple Answers
    it('Min answers validation failure while updating answers for MCQWMA', async () => {
      let error;
      await examService.createExam(reqBody);
      const savedExam = await ExamModel.findOne({ name: 'test1' });
      const examId = savedExam._id;
      const questionId = savedExam.questions[1]._id;
      const { options } = savedExam.questions[1];
      expect(options[1].isAnswer).toBeTruthy();
      expect(options[2].isAnswer).toBeTruthy();
      expect(options[0].isAnswer).toBeFalsy();
      expect(options[3].isAnswer).toBeFalsy();
      const markAnswers = [String(options[0]._id)];
      const unMarkAnswers = [String(options[1]._id), String(options[2]._id)];
      try {
        await examService.updateAnswers(examId, questionId, markAnswers, unMarkAnswers);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Update failed: Min answer count validation fails');
      expect(error.statusCode).toBe(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY_422);
    });
    it('examDetails update with name', async () => {
      await examService.createExam(reqBody);
      let savedExam = await ExamModel.findOne({ name: 'test1' });
      const examId = savedExam._id;
      await examService.updateExamDetails(examId, {
        name: 'test20',
      });
      savedExam = await ExamModel.findOne({ name: 'test1' });
      expect(savedExam).toBeNull();
      savedExam = await ExamModel.findOne({ name: 'test20' });
      expect(savedExam._id).toBeDefined();
      expect(savedExam._id).toEqual(examId);
    });
  });
  describe('Delete questions and options by Id', () => {
    it('Delete question by Id', async () => {
      await examService.createExam(reqBody);
      let savedExam = await ExamModel.findOne({ name: 'test1' });
      const examId = savedExam._id;
      expect(savedExam.questions.length).toBe(3);
      const questionId = savedExam.questions[0]._id;
      await examService.deleteQuestionById(examId, questionId);
      savedExam = await ExamModel.findById(savedExam._id);
      expect(savedExam.questions.length).toBe(2);
    });
    it('Delete option by Id', async () => {
      await examService.createExam(reqBody);
      let savedExam = await ExamModel.findOne({ name: 'test1' });
      const examId = savedExam._id;
      const question = savedExam.questions[0];
      expect(question.options.length).toBe(4);
      const optionId = String(question.options[0]._id);
      await examService.deleteOptionById(examId, String(question._id), optionId);
      savedExam = await ExamModel.findById(savedExam._id);
      expect(savedExam.questions[0].options.length).toBe(3);
    });
    it('Validation failure for deletion of option in Boolean type question', async () => {
      let error;
      await examService.createExam(reqBody);
      const savedExam = await ExamModel.findOne({ name: 'test1' });
      const examId = savedExam._id;
      const question = savedExam.questions[2];
      expect(question.options.length).toBe(2);
      const optionId = String(question.options[1]._id);
      try {
        await examService.deleteOptionById(examId, String(question._id), optionId);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Update failed: Min options for QuestionType validation fails');
      expect(error.statusCode).toBe(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY_422);
    });
  });
});
