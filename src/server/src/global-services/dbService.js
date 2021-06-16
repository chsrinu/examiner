/**
 * Module responsible for connecting to DB
 */

const mongoose = require('mongoose');

const logger = include('server/src/helpers/logger')(__filename);

const db = mongoose.connect(`mongodb+srv://${process.env.DB_LOGIN}:${process.env.DB_PASSWORD}@cluster0.nmizb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }, (err) => {
  if (err) throw err;
  else logger.info('Connected to db');
});

module.exports = db;
