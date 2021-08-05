/* eslint-disable no-underscore-dangle */
const { ExamModel } = include('server/src/modules/exam/data-models');
const { userService } = include('server/src/modules/user/services');
const { error, enums } = include('server/src/helpers');

module.exports = async (dto) => {
  const { ErrorHandler } = error;
  const { HTTP_STATUS_CODES } = enums;

  const newExam = new ExamModel(dto);
  const examiner = await userService.findUserByEmailId(dto.examinerEmail);
  if (!examiner) {
    throw new ErrorHandler(HTTP_STATUS_CODES.NOT_FOUND_404, 'examiner email not found, cannot proceed further');
  }
  newExam.examiner = examiner._id;
  return newExam;
};
