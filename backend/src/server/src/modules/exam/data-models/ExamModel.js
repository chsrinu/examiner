const mongoose = require('mongoose');

const { QUESTION_TYPES, EXAMTAKER_CATEGORY } = include('server/src/helpers/enums');

const ExamModel = mongoose.Schema({
  name: {
    type: String,
  },
  examiner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  durationInMins: Number,
  maxMarks: Number,
  questions: [{
    type: {
      type: String,
      enum: QUESTION_TYPES,
    },
    question: {
      type: String,
    },
    options: [{
      optionValue: {
        type: String,
      },
      isAnswer: {
        type: Boolean,
        default: false,
      },
    }],
  }],
  createdDate: {
    type: Date,
    default: Date.now,
  },
  examTakerCategory: {
    type: String,
    enum: EXAMTAKER_CATEGORY,
  },
});

ExamModel.index({ name: 1, examiner: 1 }, { unique: true });
// ExamModel.index({ name: 1, 'questions.question': 1 }, { unique: true });
// tried to put condition to ensure all the options in a question are different
// ExamModel.index({ 'questions.question': 1, 'questions.options.optionValue': 1 }, { unique: true });
module.exports = mongoose.model('ExamModel', ExamModel);
