import jwt from 'jwt-simple';

import { JWT_SECRET } from '../config';

const cookieName = 'CONF_USER';

function setJWT({ res, token, user }) {
  const options = { httpOnly: true, secure: !!process.env.SECURE_COOKIES };
  if (user) {
    options.expires = new Date();
    options.expires.setMinutes(options.expires.getMinutes() + 30);
    // allow the client to ascertain the expiry time, to allow for auto logout
    res.set('X-Expires-At', options.expires.getTime());
    res.cookie(cookieName, token, options);
  } else {
    res.clearCookie(cookieName, options);
  }
}

function encodeJWT(user) {
  return jwt.encode(user, JWT_SECRET);
}

function decodeJWT(token) {
  return jwt.decode(token, JWT_SECRET);
}

export default {
  encodeJWT,
  decodeJWT,
  setJWT,
  cookieName,
};
