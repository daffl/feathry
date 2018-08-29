import assert from 'assert';
import request from 'request';
import createApplication from './server-fixtures';

describe('REST API authentication with valid auth token', function () {
  this.timeout(10000);
  let server,
    app,
    username = 'feathers',
    token,
    password = 'test',
    settings = {
      secret: 'feathers-rocks'
    };

  before(function (done) {

    createApplication(settings, username, password, function (err, obj) {
      app = obj.app;
      server = obj.server;

      request({
        url: 'http://localhost:8888/api/login',
        method: 'POST',
        form: {
          username: username,
          password: password
        },
        json: true
      }, function(err, res, body) {
        token = body.token;
        done();
      });
    });
  });

  after(function (done) {
    server.close(done);
  });


  it('Requests with valid auth to protected services will return data', function (done) {
    request({
      url: 'http://localhost:8888/api/todos',
      method: 'GET',
      json: true,
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }, function (err, res, body) {
      assert.equal(body.length, 3, 'Got data back');
      assert.equal(body[0].name, 'Do the dishes', 'Got todos back');
      done();
    });
  });

  it('Requests with valid auth to unprotected services will return data', function (done) {
    request({
      url: 'http://localhost:8888/api/tasks',
      method: 'GET',
      json: true,
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }, function (err, res, body) {
      assert.equal(body.length, 3, 'Got data back');
      assert.equal(body[0].name, 'Feed the pigs', 'Got tasks back');
      done();
    });
  });

  it('Requests to refresh a valid token will return data', function (done) {
    request({
      url: 'http://localhost:8888/api/login/refresh',
      method: 'POST',
      form: {
        token: token
      },
      json: true
    }, function (err, res, body) {
      assert.ok(body.token, 'POST to /api/login gave us back a token.');
      assert.equal(body.token, token, 'Token is the same');
      done();
    });
  });

});
