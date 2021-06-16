const express = require('express');

const app = express();
require('dotenv').config();
require('./server/globals/fileImportWrapper');

const { HTTP_STATUS_CODES } = include('server/src/helpers/enums');
include('server/src/global-services/dbService');
const logger = include('server/src/helpers/logger')(__filename);
const { userRoute } = include('server/src/modules/user/routes');
const { error } = include('server/src/helpers');
const { handleError, ErrorHandler } = error;
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/user', userRoute);
app.get('/', (req, res) => {
  res.send('Welcome to examiner');
});

// handles all the 404 errors
app.use((req, res, next) => {
  next(new ErrorHandler(HTTP_STATUS_CODES.NOT_FOUND_404, 'Not found'));
});

app.use((err, req, res, next) => {
  logger.error(err);
  handleError(err, res);
});

app.listen(PORT, () => {
  logger.info(`Server listening on PORT ${PORT}`);
});
