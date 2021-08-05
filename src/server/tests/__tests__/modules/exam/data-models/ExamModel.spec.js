/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const mongoose = require('mongoose');
require('../../../../../globals/fileImportWrapper');

const { ExamModel } = include('server/src/modules/exam/data-models');
const { UserModel } = include('server/src/modules/user/data-models');

const dbService = include('server/tests/dbService');
const { examDtoToEntity } = include('server/src/modules/exam/converters');

const unnecessaryFieldsProjection = '-__v -questionPaper.options.isAnswer';

const validUser = {
  email: 'test56@gmail.com',
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
      question: 'Whats your name?',
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
  examTakerCategory: 'SCHOOL_KID',
};

beforeAll(async () => {
  dbService.connect();
  const newUser = new UserModel(validUser);
  await newUser.save();
});
afterEach(async () => {
  dbService.clearDatabase();
  const newUser = new UserModel(validUser);
  await newUser.save();
});
afterAll(async () => dbService.closeDatabase());

describe('ExamModel test suite', () => {
  describe('Save Exam sample object', () => {
    it('Save and retrieve', async () => {
      const newExam = await examDtoToEntity(reqBody);
      expect(newExam.examiner).toBeDefined();
      await newExam.save();

      const exam = await ExamModel.findOne({
        name: newExam.name,
        examiner: mongoose.Types.ObjectId(newExam.examiner),
      }, '-questions.options.isAnswer -__v').populate('examiner', 'email firstName lastName -_id').lean();

      expect(exam).toBeDefined();
      const savedExamEntity = await ExamModel.findOne({ name: 'test1' }, unnecessaryFieldsProjection);
      expect(savedExamEntity).toBeDefined();
      const unknownExam = await ExamModel.findOne({ name: 'test2' });
      expect(unknownExam).toBeNull();
    });

    it('Creating answerKey using aggregation', async () => {
      const newExam = await examDtoToEntity(reqBody);
      expect(newExam.examiner).toBeDefined();
      const savedExam = await newExam.save();
      const answerKey = await ExamModel.aggregate([
        {
          $match: {
            _id: savedExam._id,
          },
        },
        { $unwind: '$questions' },
        { $unwind: '$questions.options' },
        { $match: { 'questions.options.isAnswer': true } },
        {
          $group: {
            _id: '$questions._id',
            answers: {
              $push: '$questions.options._id',
            },
          },
        },
      ]);
      expect(answerKey).toBeDefined();
      expect(answerKey.length).toBe(2);
    });

    it('Update a question in Exam', async () => {
      // should be able to handle updating questionType, options, Changing the answer
      const newExam = await examDtoToEntity(reqBody);
      const savedExam = await newExam.save();
      let exam = await ExamModel.findById(savedExam._id);
      const questionObj = await exam.questions.id(savedExam.questions[0]._id);
      questionObj.question = 'Introduce your self';
      await exam.save();
      exam = await ExamModel.findById(savedExam._id);
      const updatedQuestion = exam.questions.id(exam.questions[0]._id);
      expect(updatedQuestion.question).toBe('Introduce your self');
    });

    it('Delete a question in Exam', async () => {
      const newExam = await examDtoToEntity(reqBody);
      const savedExam = await newExam.save();
      let exam = await ExamModel.findById(savedExam._id);
      await exam.questions.id(exam.questions[0]._id).remove();
      exam = await exam.save();
      expect(exam.questions.length).toBe(1);
    });

    it('Delete an option inside a question', async () => {
      // handle when someone tries to delete an option which is the answer
      const newExam = await examDtoToEntity(reqBody);
      const savedExam = await newExam.save();
      let exam = await ExamModel.findById(savedExam._id);
      await exam.questions.id(exam.questions[0]._id)
        .options.id(exam.questions[0].options[0]._id).remove();
      exam = await exam.save();
      const optionsLengthAfterDelete = await exam
        .questions.id(exam.questions[0]._id).options.length;
      expect(optionsLengthAfterDelete).toBe(3);
    });

    it('Change duration and Max Marks', async () => {
      const newExam = await examDtoToEntity(reqBody);
      const savedExam = await newExam.save();
      let exam = await ExamModel.findById(savedExam._id);
      exam.durationInMins = 40;
      exam.maxMarks = 90;
      await exam.save();
      exam = await ExamModel.findById(savedExam._id);
      expect(exam.durationInMins).toBe(40);
      expect(exam.maxMarks).toBe(90);
    });
  });
});
