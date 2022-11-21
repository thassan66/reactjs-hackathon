const request = require('request');

function scrubbed(obj) {
  for (let key in obj) {
    if (key.match(/password/)) {
      obj[key] = 'SCRUBBED';
    } else if (typeof obj[key] === 'object') {
      obj[key] = scrubbed(obj[key]);
    }
  }
  return obj;
}

function requestPromise(options) {
  const returnAll = options.returnAll && delete options.returnAll;
  return new Promise((resolve, reject) => {
    options.timeout = 20000;
    options.uri = encodeURI(options.uri);
    request(options, (err, response, body) => {
      if (err || response.statusCode > 299) {
        const rejectError = Object.assign(
          err || {},
          {
            status: (response && response.statusCode) || 500,
            //message: body ? (body['error-code'] || body) : null, TODO: remove after testing
            message: body ? body : null,
            options: scrubbed(options),
          });
        reject(rejectError);
      } else {
        resolve(returnAll ? { err, response, body, options } : body);
      }
    });
  });
}

module.exports = requestPromise;
