const assert = require('assert');
const getApp = require('./fixture');

describe('@feathersjs/authentication-local/strategy', () => {
  const password = 'localsecret';
  const email = 'localtester@feathersjs.com';

  let app, user;

  beforeEach(() => {
    app = getApp();

    return app.service('users')
      .create({ email, password })
      .then(createdUser => {
        user = createdUser;
      });
  });

  it('fails when entity not found', () => {
    const authService = app.service('authentication');
    return authService.create({
      strategy: 'local',
      email: 'not in database',
      password
    }).then(() => {
      assert.fail('Should never get here');
    }).catch(error => {
      assert.strictEqual(error.name, 'NotAuthenticated');
      assert.strictEqual(error.message, 'Invalid login');
    });
  });

  it('strategy fails when strategy is different', () => {
    const [ local ] = app.service('authentication').getStrategies('local');
    return local.authenticate({
      strategy: 'not-me',
      password: 'dummy',
      email
    }).then(() => {
      assert.fail('Should never get here');
    }).catch(error => {
      assert.strictEqual(error.name, 'NotAuthenticated');
      assert.strictEqual(error.message, 'Invalid login');
    });
  });

  it('fails when password is wrong', () => {
    const authService = app.service('authentication');
    return authService.create({
      strategy: 'local',
      email,
      password: 'dummy'
    }).then(() => {
      assert.fail('Should never get here');
    }).catch(error => {
      assert.strictEqual(error.name, 'NotAuthenticated');
      assert.strictEqual(error.message, 'Invalid login');
    });
  });

  it('fails when password field is not available', () => {
    const userEmail = 'someuser@localtest.com';
    const authService = app.service('authentication');

    return app.service('users').create({
      email: userEmail
    }).then(() => authService.create({
      strategy: 'local',
      password: 'dummy',
      email: userEmail
    })).then(() => {
      assert.fail('Should never get here');
    }).catch(error => {
      assert.strictEqual(error.name, 'NotAuthenticated');
      assert.strictEqual(error.message, 'Invalid login');
    });
  });

  it('authenticates an existing user', () => {
    const authService = app.service('authentication');
    return authService.create({
      strategy: 'local',
      email,
      password
    }).then(authResult => {
      const { accessToken } = authResult;

      assert.ok(accessToken);
      assert.strictEqual(authResult.user.email, email);

      return authService.verifyJWT(accessToken);
    }).then(decoded => {
      assert.strictEqual(decoded.sub, `${user.id}`);
    });
  });

  it('returns safe result when params.provider is set, works without pagination', () => {
    const authService = app.service('authentication');
    return authService.create({
      strategy: 'local',
      email,
      password
    }, {
      provider: 'rest',
      paginate: false
    }).then(authResult => {
      const { accessToken } = authResult;

      assert.ok(accessToken);
      assert.strictEqual(authResult.user.email, email);
      assert.strictEqual(authResult.user.passsword, undefined);

      return authService.verifyJWT(accessToken);
    }).then(decoded => {
      assert.strictEqual(decoded.sub, `${user.id}`);
    });
  });
});
