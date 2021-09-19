/**
 * Service module for interacting with the SecretCodeModel,
 * Creates a 6 digit secret code and saves it in the database
 */

const { SecretCodeModel } = include('server/src/modules/user/data-models');

const secretCodeService = {
  async generateCode() {
    const code = Math.floor(100000 + Math.random() * 900000);
    const newUserSecretCode = new SecretCodeModel({ code });
    return newUserSecretCode.save();
  },
  async deleteCode(id) {
    await SecretCodeModel.deleteOne({ _id: id });
  },
};

module.exports = secretCodeService;
