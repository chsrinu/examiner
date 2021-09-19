const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
require('dotenv').config();
require('./server/globals/fileImportWrapper');

include('server/src/global-services/dbService');
const { HTTP_STATUS_CODES } = include('server/src/helpers/enums');
const logger = include('server/src/helpers/logger')(__filename);
const { userRoute } = include('server/src/modules/user/routes');
const { examRoute } = include('server/src/modules/exam/routes');
const { error } = include('server/src/helpers');
const { handleError, ErrorHandler } = error;
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'client', 'build')));
app.use(express.json());
app.use(cookieParser());

app.use('/user', userRoute);
app.use('/exam', examRoute);

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
