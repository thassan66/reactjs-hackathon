/* global __dirname */
import morgan from 'morgan';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
// set env variables before all else
import { GATEWAY_PORT, CORS_ORIGINS, logger } from './config.js';
import { permissions } from './utils';
// import gw dependencies
import { authentication, utils } from './services';

const version = utils.version();

// set up app and middleware
const app = express();

morgan.token('user-id', req => req.user && req.user.id);
const stream = {
  write(message) {
    logger.info(message.trim());
  },
};
app.use(morgan(
  'User::user-id Correlation::req[x-correlation-id] Method::method URL::url Status::status :res[content-length] - :response-time ms',
  { stream },
));


app.use(cookieParser());
// strict is false so that we can accept strings (and handle without throwing)
app.use(bodyParser.json({ limit: '100mb', strict: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.disable('x-powered-by');

// CORS headers to allow running client/server on different ports
// remove comments to track memory usage
app.use((req, res, next) => {
  //const start = Date.now();
  const cachedSend = res.send;
  //const memStart = process.memoryUsage();
  res.send = (...args) => {
    // const usage = (prop) => [
    //   Math.round((memEnd[prop] - memStart[prop]) / 1024),
    //   Math.round(memEnd[prop] / 1024),
    // ];
    // const memEnd = process.memoryUsage();
    // const row = [
    //   req.method, req.url, Date.now() - start,
    //   ...usage('external'),
    //   ...usage('heapUsed'),
    // ].join(',');
    // logger.info(row)// eslint-disable-line
    cachedSend.call(res, ...args);
  };
  // Check if the origin is whitelisted in the env vars
  const actual = req.headers.origin || '';
  if (utils.matchCors(actual, CORS_ORIGINS.split(','))) {
    res.set({ 'Access-Control-Allow-Origin': actual });
  }

  res.set({
    // standard CORS headers
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Accept-Language',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'PATCH,POST,GET,DELETE',

    // addresses security issues identified by automated pen testing
    'x-frame-options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': 1,
  });
  next();
});

// set the user property of the request object
app.use((req, res, next) => {
  const token = req.cookies[authentication.cookieName];
  if (!token || req.url.match(/identity\/logout/)) {
    req.user = false;
  } else {
    req.user = authentication.decodeJWT(token);
  }
  utils.setCorrelationId(req.headers['x-correlation-id']);
  req.correlationId = req.headers['x-correlation-id'];
  next();
});

// helper function returning middleware to reject unauthorised users
function requiredPermissions(requiredPermissions) {
  return function requireRolesHandler(req, res, next) {
    if (!req.user || !permissions.isPermitted(req.user.permissions, requiredPermissions)) {
      const error = new Error('UNAUTHORISED');
      error.status = 403;
      next(error);
    } else {
      next();
    }
  };
}

// Add the endpoints to express.
// Reversed to get literal routes before @ capture groups.
utils.parseDirectory(`${__dirname}/rest`, [], true).reverse().forEach(endpoint => {
  const { action, functions, method, permissions, roles, url } = endpoint;
  // add a middleware function to check the permissions as required
  if (permissions) {
    functions.unshift(requiredPermissions(permissions));
  }
  // add the express listener
  app[method](
    `/api/v${version.major}/${url}`,
    functions,
  );
});

// eslint disabled as signature needs 4 arguments
app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
  error.status = error.status || 500;
  if (error.message === 'UNAUTHORISED') {
    error.status = 403;
  }
  res.status(error.status)
    .send({
      error: {
        message: error.message,
        status: error.status,
      },
    });
});

// setup server
const server = app.listen(GATEWAY_PORT, () => {
  //logger.info(`Allowed CORS: ${CORS_ORIGINS}`);
  //logger.info(`Started ${version.name} (${version.number}) listening on ${GATEWAY_PORT}`);
});

export { app, server };
