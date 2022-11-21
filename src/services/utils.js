import fs from 'fs';
import path from 'path';
import { permissions, requestPromise as commonRequest } from '../utils';

const pkg = require(`${process.cwd()}/package.json`);//eslint-disable-line

let correlationId;

const version = () => {
  const parts = pkg.version.split('.');
  return {
    name: pkg.name,
    number: pkg.version,
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
  };
};

const setCorrelationId = (id) => {
  correlationId = id;
};

function requestPromise(options) {
  options.headers = options.headers || {};
  options.headers['x-correlation-id'] = correlationId;
  options.rejectUnauthorized = false;
  return commonRequest(options);
}

// recurse over rest directory structure and build endpoint array
const parseDirectory = (dir, endpoints) => {
  fs.readdirSync(dir).forEach(filename => {
    const [method, isFile] = filename.split('.');
    if (isFile) {
      // the url without the /api/VERSION part
      const url = dir.replace(/@/g, ':').split('/rest/')[1];
      const action = `${method}:${url}`;

      let endpoint = require(path.resolve(dir, filename)); // eslint-disable-line

      // Fix mismatch between require/ES6 imports
      endpoint = endpoint.default || endpoint;

      // mutate the permissions object, adding inferred roles.
      const inferred = permissions.getHigherPermissions(endpoint.permissions);
      if (inferred.length) endpoint.permissions = inferred;

      // get the roles that apply to this action
      const roles = Object.values(permissions.rolesToPermissions)
        .map(role => ({
          name: role.name,
          matches: permissions.isPermitted(role.permissions, endpoint.permissions),
        }))
        .filter(role => role.matches);

      // add other properties to the required file
      endpoint = Object.assign(endpoint, { action, method, roles, url });
      endpoints.push(endpoint);
    } else {
      parseDirectory(`${dir}/${method}`, endpoints);
    }
  });
  return endpoints;
};

const matchCors = (actual, whitelist) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const allowed of whitelist) {
    // Allow wildcard subdomain matching
    const isMatch = allowed.substr(0, 2) === '*.'
      ? actual.indexOf(allowed.substr(1)) === (actual.length - allowed.length) + 1
      : actual === allowed;
    if (isMatch) {
      return actual;
    }
  }
  return null;
};

export default {
  matchCors,
  parseDirectory,
  requestPromise,
  setCorrelationId,
  version,
};
