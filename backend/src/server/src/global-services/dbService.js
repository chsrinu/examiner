/**
 * Module responsible for connecting to DB
 */

const mongoose = require('mongoose');

const logger = include('server/src/helpers/logger')(__filename);

const db = mongoose.connect(`mongodb://${process.env.DB_SERVER}/${process.env.DB_NAME}`, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }, (err) => {
  if (err) throw err;
  else logger.info('Connected to db');
});

module.exports = db;
