/* eslint-disable global-require */
// __dir points to C:\repos\examiner\src\server\globals so
// base_dir points to C:\repos\examiner\src
const path = require('path');
// points to main src folder in project directory
const baseDir = path.join(__dirname, '/../..');
const absPath = (currentPath) => baseDir + currentPath;
// points to folder where the nodu_modules exists or project directory
global.rootDir = path.join(baseDir, '/../');

// eslint-disable-next-line import/no-dynamic-require
global.include = (currentPath) => require(absPath(path.join('/', currentPath)));
