# feathers-authentication

[![Build Status](https://travis-ci.org/feathersjs/feathers-authentication.png?branch=master)](https://travis-ci.org/feathersjs/feathers-authentication)

> Add Authentication to your FeathersJS app.

`feathers-authentication` adds shared [PassportJS](http://passportjs.org/) authentication for Feathers HTTP REST and websockets services using [JSON Web Tokens](http://jwt.io/).

## Usage
If you are using the default options, setting up JWT auth for your Feathers app is as simple as the below example.  Note: You must set up the `body-parser` module before setting up `feathers-authentication`.

```js
var app = feathers()
  .configure(feathers.rest())
  .configure(feathers.socketio())
  .configure(hooks())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))

  // Configure feathers-authentication
  .configure(feathersAuth({
    secret: 'feathers-rocks'
  }));
```

## Getting Started Tutorial

Here's a more complete example that you can use to get started.

```js
/* * * Import Feathers and Plugins * * */
var feathers = require('feathers');
var hooks = require('feathers-hooks');
var bodyParser = require('body-parser');
var feathersAuth = require('feathers-authentication').default;
var authHooks = require('feathers-authentication').hooks;

/* * * Prepare the Mongoose service * * */
var mongooseService = require('feathers-mongoose');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UserSchema = new Schema({
  username: {type: String, required: true, unique: true},
  password: {type: String, required: true },
  createdAt: {type: Date, 'default': Date.now},
  updatedAt: {type: Date, 'default': Date.now}
});
var UserModel = mongoose.model('User', UserSchema);

/* * * Connect the MongoDB Server * * */
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/feathers');

/* * * Initialize the App and Plugins * * */
var app = feathers()
  .configure(feathers.rest())
  .configure(feathers.socketio())
  .configure(hooks())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))

  // Configure feathers-authentication
  .configure(feathersAuth({
    secret: 'feathers-rocks'
  }));

/* * * Setup the User Service and hashPassword Hook * * */
app.use('/api/users', new mongooseService('user', UserModel))
var service = app.service('/api/users');
service.before({
  create: [authHooks.hashPassword('password')]
});

/* * * Start the Server * * */
var port = 3030;
var server = app.listen(port);
server.on('listening', function() {
  console.log(`Feathers application started on localhost:3030);
});
```

Please note that the above User service does not include any kind of authorization or access control.  That will require setting up additional hooks, later.  For now, leaving out the access control will allow us to easily create a user.  Here's an example request to create a user (make sure your server is running):

```js
// Create User (POST http://localhost:3030/api/users)
jQuery.ajax({
  url: 'http://localhost:3030/api/users',
  type: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  contentType: 'application/json',
  data: JSON.stringify({
    'username': 'feathersuser',
    'password': 'fowlplay'
  })
})
.done(function(data, textStatus, jqXHR) {
    console.log('HTTP Request Succeeded: ' + jqXHR.status);
    console.log(data);
})
.fail(function(jqXHR, textStatus, errorThrown) {
    console.log('HTTP Request Failed', arguments);
});
```

Once you've created a user, logging in is as simple as `POST`ing a request to the `loginEndpoint`, which is `/api/login` by default.  Here's an example request for logging in:

```js
// Login by email (POST http://localhost:3030/api/login)
jQuery.ajax({
  url: 'http://localhost:3030/api/login',
  type: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  contentType: 'application/json',
  data: JSON.stringify({
    'username': 'feathersuser',
    'password': 'fowlplay'
  })
})
.done(function(data, textStatus, jqXHR) {
  console.log('HTTP Request Succeeded: ' + jqXHR.status);
  console.log(data);
})
.fail(function(jqXHR, textStatus, errorThrown) {
  console.log('HTTP Request Failed', arguments);
});
```
The server will respond with an object that contains two properties, `user` and `token`.  The `user` property contains an object with whatever data was returned from your user service.  You'll notice that it currently includes the password.  You really don't want it exposed, so when you're ready to secure the service, you'll need an additional feathers-hook to remove the password property from the response. 

The `token` property contains a JWT token that you can use to authenticate REST requests or for socket connections.  You can learn more about how JWT tokens work on [jwt.io](http://jwt.io/).


### Authenticating REST Requests

Authenticated REST requests must have an `Authorization` header in the format `'Bearer <token>'`, where the <token> is the JWT token. The header should have the following format:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IklseWEgRmFkZWV2IiwiYWRtaW4iOnRydWV9.YiG9JdVVm6Pvpqj8jDT5bMxsm0gwoQTOaZOLI-QfSNc
```

Assuming you've set up a todos service, here is full request example you can try out. Be sure to replace `<token>` with a token you've retrieved from your `loginEndpoint`:

```js
// List Todos (GET http://localhost:3030/api/todos)
jQuery.ajax({
  url: 'http://localhost:3030/api/todos',
  type: 'GET',
  headers: {
    "Authorization": "Bearer <token>",
    "Accept": "application/json",
  },
})
.done(function(data, textStatus, jqXHR) {
    console.log("HTTP Request Succeeded: " + jqXHR.status);
    console.log(data);
})
.fail(function(jqXHR, textStatus, errorThrown) {
    console.log("HTTP Request Failed", arguments);
});
```

### Authenticating Socket.io Connections

In order to authenticate a Websocket connection, you must first obtain a token using an Ajax request to your `loginEndpoint`.  You then include that token in the request.  The example below is for Socket.io, but the same `query` key can be passed to Primus.

```js
socket = io('', {
  // Assuming you've already saved a token to localStorage.
  query: 'token=' + localStorage.getItem('featherstoken'),
  transports: ['websocket'], // optional, see below
  forceNew:true,             // optional, see below
});
```

In the above example, the `transports` key is only needed if you, for some reason, need to force the browser to only use websockets.  The `forceNew` key is only needed if you have previously connected an *unauthenticated* Websocket connection and you now want to start an *authenticated* request.


## Options

The following options are available:

- __secret__ *required* - The secret used to create encrypted tokens.
- __userEndpoint__ - The api endpoint used to look up the user service. The default is `'/api/users`.
- __loginEndpoint__ - The url for posting the username and password during login. The default is `/api/login`.  You can also post a valid token here to receive a new one.  You might use this when the current auth token is about to expire to stay logged in on the client.
- __usernameField__ The database field containing the username on the user service.  The default is `username`.
- __passwordField__ The database field containing the password on the user service.  The default is `password`.
- __loginError__ - The message to return for invalid login.  Default is 'Invalid login.'
- __jwtOptions__ - Used to customize the configuration for the jsonwebtoken library.  [See the API](https://github.com/auth0/node-jsonwebtoken)
- __jwtOptions.expiresIn__ - The number of **seconds** until the token expires.  Default is 36000 (10 hours).
- __strategy__ - Allows you to pass a custom strategy to use for local auth.  The default strategy should fit most projects.
- __passport__ (default: `require('passport')`) - The passport module


## Bundled Hooks
The `feathers-authentication` plugin automatically handles auth.  Keep in mind that access control is not automatic, but is easy to set up with the included hooks.   See the [feathers-hooks](https://github.com/feathersjs/feathers-hooks) plugin and the [FeathersJS website](http://feathersjs.com/learn) for more information about hooks.

#### hashPassword('password')
This is intended to be used on the user service on the `create` method.  It will automatically hash the data coming in on the `password` field.  You can specify another field by providing another string.

#### requireAuth

## Example

The following shows a commented example for an application using local authentication with a Feathers user service:

```js
var feathers = require('feathers');
var passport = require('passport');
var hooks = require('feathers-hooks');
var memory = require('feathers-memory');
var bodyParser = require('body-parser');
var feathersAuth = require('feathers-authentication').default;
var authHooks = require('feathers-authentication').hooks;

// Initialize the application
var app = feathers()
  .configure(feathers.rest())
  .configure(feathers.socketio())
  .configure(hooks())
  // Needed for parsing bodies (login)
  .use(bodyParser.urlencoded({ extended: true }))
  // Configure feathers-authentication
  .configure(feathersAuth({
    secret: 'feathers-rocks'
  }))
  // Initialize a user service
  .use('/api/users', memory())
  // A simple Todos service that we can used for testing
  .use('/todos', {
    get: function(id, params, callback) {
      callback(null, {
        id: id,
        text: 'You have to do ' + id + '!',
        user: params.user
      });
    }
  })
  .use('/', feathers.static(__dirname));

var userService = app.service('/api/users');

// Add a hook to the user service that automatically replaces 
// the password with a hash of the password before saving it.
userService.before({
  create: authHooks.hashPassword('password')
});

// Create a user that we can use to log in
userService.create({
  username: 'feathers',
  password: 'secret'
}, {}, function(error, user) {
  console.log('Created default user', user);
});

app.listen(4000);
```

Add a `login.html` with an HTML form that allows to log our user in:

```html
<!DOCTYPE html>
<html>
<head lang="en">
  <meta charset="UTF-8">
  <title></title>
</head>
<body>
  <form action="/login" method="post">
    <div>
      <label>Username:</label>
      <input type="text" name="username"/>
    </div>
    <div>
      <label>Password:</label>
      <input type="password" name="password"/>
    </div>
    <div>
      <input type="submit" value="Log In"/>
    </div>
  </form>
</body>
</html>
```

## About


## Changelog

__0.0.5__

- Initial release

## License

Copyright (c) 2015

Licensed under the [MIT license](LICENSE).
