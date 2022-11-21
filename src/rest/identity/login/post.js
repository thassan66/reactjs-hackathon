import { authentication, users } from '../../../services';

async function login(req, res, next) {
    try {
        const user = await users.login(req.body, req.body);
        const token = authentication.encodeJWT(user);
        authentication.setJWT({ res, token, user });
        res.send(user);
    } catch (e) {
        next({
            message: 'Authentication failed',
            status: 404,
        });
    }
}

module.exports = {
    functions: [
      login,
    ],
  };