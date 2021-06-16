/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-var */
/* eslint-disable func-names */
/* eslint-disable no-return-await */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { roles, USER_STATUS } = include('server/src/helpers/enums');
const saltRounds = 10;

const userSchema = mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
  password: String,
  firstName: String,
  lastName: String,
  role: {
    type: String,
    default: roles.USER,
  },
  status: {
    type: String,
    default: USER_STATUS.PENDING,
  },
  verificationCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'secretCode',
  },
});

userSchema.pre('save', function (next) {
  var user = this;
  if (user.isModified('password')) {
    bcrypt.genSalt(saltRounds, function (err, salt) {
      if (err) next(err);

      bcrypt.hash(user.password, salt, function (error, hash) {
        if (err) next(err);
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.isAdmin = (role, cb) => cb(role === roles.ADMIN);

module.exports = mongoose.model('User', userSchema);
