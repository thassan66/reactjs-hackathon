const lowerActions = {
  READ: ['LIST', 'VIEW'],
  WRITE: ['CREATE', 'UPDATE', 'DELETE'],
};
// if no action i.e. all permissions for this entity
lowerActions[undefined] = ['READ', 'WRITE'].concat(lowerActions.WRITE).concat(lowerActions.READ);

function mapRoles() {
  const permissions = [
    'DATA:LIST',
    'NOTIFICATIONS:LIST',
    'NOTIFICATIONS:UPDATE',
    'PRODUCTS:LIST',
    'SITES:LIST',
    'USERS:LIST',
    'FEEDBACK:CREATE',
  ];

  return [
    {
      name: 'User',
      permissions: [],
    },
    {
      name: 'Administrator',
      permissions: [
        'DATA',
        'FEEDBACK',
        'NOTIFICATIONS',
        'PRODUCTS',
        'SITES',
        'USERS',
      ],
    },
  ].reduce((roles, role) => {
    // currently the roles are hierarchical, and inherit the previous
    permissions.push(...role.permissions);
    // do not add lower level permissions if the role has higher ones
    // e.g. add TENANTS instead of TENANTS:EDIT
    role.permissions = removeLowerPermissions(permissions);
    roles[role.name] = role;
    return roles;
  }, {});
};

function getPermissionsObject(permissions) {
  return permissions.reduce((obj, permission) => {
    const [entity, action] = permission.split(':');
    obj[permission] = {
      entity,
      action,
      lower: lowerActions[action] && lowerActions[action].map(action => `${entity}:${action}`),
    };
    return obj;
  }, {});
}

function getUserPermissions(user) {
  return user.roles.reduce((permissions, role) => {
    permissions.push(...rolesToPermissions[role].permissions);
    return permissions;
  }, []);
}

function getEntityList() {
  const topLevel = getAllPermissions().reduce((reduced, permission) => {
    if (!reduced[permission.split(':')[0]]) reduced[permission] = true;
    return reduced;
  }, {});
  return Object.keys(topLevel);
}

function getLowestPermissionList() {
  return getEntityList().reduce((all, entity) => {
    ['LIST', 'VIEW', 'CREATE', 'UPDATE'].forEach(action => {
      const permission = `${entity}:${action}`;
      all.push(permission);
    });
    return all;
  }, []);
}

function getAllPermissions() {
  const all = Object.values(rolesToPermissions).reduce((object, role) => {
    return object.concat(role.permissions);
  }, []);
  const permissionsObject = getPermissionsObject(all);
  return Object.keys(permissionsObject).sort();
}


// find all the matching permissions on a given role
function isPermitted(permissionList, requiredPermissions) {
  // if no permissions required
  if (!requiredPermissions || !requiredPermissions.length) return 'UNAUTHED';
  return requiredPermissions.find(required => permissionList.includes(required)) || false;
};

function removeLowerPermissions(permissions) {
  // create an object keyed on all permissions
  const permissionsObject = getPermissionsObject(permissions);
  Object.values(permissionsObject).forEach(permission => {
    (permission.lower || []).forEach(action => delete permissionsObject[action]);
  });
  return Object.keys(permissionsObject).sort();
}

function getHigherPermissions(lowerPermissions = []) {
  const permissions = lowerPermissions.slice();
  // this function is to automatically add hight level permissions
  // e.g. if an action has a 'ALERTS:VIEW' permission
  // we should allow roles with an 'ALERTS:READ' or 'ALERTS' permission
  let i = 0;
  while (permissions[i]) {
    const [entity, action] = permissions[i].split(':');
    const map = {
      LIST: `${entity}:READ`,
      VIEW: `${entity}:READ`,
      CREATE: `${entity}:WRITE`,
      UPDATE: `${entity}:WRITE`,
      DELETE: `${entity}:WRITE`,
      WRITE: entity,
      READ: entity,
    };
    const inferred = map[action];
    if (inferred && !permissions.includes(inferred)) permissions.push(inferred);
    i++;
  };
  // put the inferred higher level permissions at the start of the array
  return permissions.reverse();
}

function getLowerPermissions(permissions = []) {
  const inferred = permissions.slice();
  function add(inferredAction) {
    const permission = `${entity}:${inferredAction}`;
    if (!inferred.includes(permission)) inferred.push(permission);
  }
  // this function is to automatically add lower level permissions
  // e.g. if an action has a 'ALERTS:VIEW' permission
  // we should allow roles with an 'ALERTS:READ' or 'ALERTS' permission
  let entity, action, i = 0;
  while (inferred[i]) {
    [entity, action] = inferred[i].split(':');
    if (!action) ['READ', 'WRITE'].map(add);
    else if (action === 'READ') ['LIST', 'VIEW'].map(add);
    else if (action === 'WRITE') ['CREATE', 'UPDATE', 'DELETE'].map(add);
    i++;
  };
  return inferred;
}

const rolesToPermissions = mapRoles();

module.exports = {
  getEntityList,
  getUserPermissions,
  getAllPermissions,
  getLowestPermissionList,
  getLowerPermissions,
  getHigherPermissions,
  isPermitted,
  rolesToPermissions,
};
