import { users, permissions } from '../utils';

function login({ email, password }) {
    const userList = Object.values(users);
    const user = userList.find(listedUser => listedUser.email === email && listedUser.password === password)
    user.permissions = permissions.getUserPermissions(user);
    return user;
}

export default {
    login,
}