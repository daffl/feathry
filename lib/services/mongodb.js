var Proto = require('uberproto');
var error = require('../errors');
var mongo = require('mongoskin');
var _ = require('underscore');

// TODO (EK): Does order matter for how these filters
// are applied? I think it does or at least it should.

var filters = {
  sort: function (values, param) {
    return _.sortBy(values, function (item) {
      return item[param];
    });
  },
  order: function (values) {
    return values.reverse();
  },
  skip: function (values, param) {
    return values.slice(param);
  },
  limit: function (values, param) {
    return values.slice(0, param);
  }
};

var MongoService = Proto.extend({

  // TODO (EK): How do we handle indexes?
  init: function (options) {
    options = options || {};

    this.type = 'mongodb';
    this._id = options.idField || '_id';
    this.connectionString = options.connectionString || null;
    this.collection = options.collection || null;

    // NOTE (EK): We need to get the collection somehow.
    // We have 3 options:
    //   1. Pass in the path on each request
    //   2. Initialize separate instances and pass it in there
    //   3. Set the collection when we register each service
    //
    // We are currently using option number 3. This could be a bad assumption.

    if (this.connectionString){
      this.store = mongo.db(this.connectionString);
    }
    else {
      this._connect(options);
    }
  },

  // NOTE (EK): We create a new database connection for every MongoService.
  // This may not be good but... in the mean time the rational for this
  // design is because each user of a MongoService instance could be a separate
  // app residing on a totally different server.

  // TODO (EK): We need to handle replica sets.
  _connect: function(options){
    this.host = options.host || process.env.MONGODB_HOST || 'localhost';
    this.port = options.port || process.env.MONGODB_PORT || 27017;
    this.db = options.db || process.env.MONGODB_DB || 'feathers';

    ackOptions = {
      w: options.w || 1,                  // write acknowledgment
      journal: options.journal || false,  // doesn't wait for journal before acknowledgment
      fsync: options.fsync || false       // doesn't wait for syncing to disk before acknowledgment
    };

    if (options.safe) {
      ackOptions = { safe: options.safe };
    }

    var connectionString = this.host + ':' + this.port + '/' + this.db;

    if (options.username && options.password){
      connectionString =+ options.username + ':' + options.password + '@';
    }

    if (options.reconnect) connectionString += '?auto_reconnect=true';

    this.store = mongo.db(connectionString, ackOptions);
  },

  find: function (params, cb) {
    var id = null;

    if (_.isFunction(params)){
      cb = params;
      params = {};
    }
    else {
      id = params.id;
    }

    params.query = params.query || {};

    if (!this.collection) return cb(new Error('No collection specified'));

    // TODO (EK): sort out filters.
    // ie. sort, limit, fields, skip, etc...

    if (id){
      this.store.collection(this.collection).findById(id, params.query, cb);
    }
    else {
      this.store.collection(this.collection).find(params.query).toArray(cb);
    }
  },

  get: function (id, params, cb) {

    if (_.isFunction(id)){
      cb = id;
      return cb(new Error('An string or number id must be provided'));
    }

    if (_.isFunction(params)){
      cb = params;
      params = {};
    }

    params.query = params.query || {};

    if (_.isString(id)){
      id = id.toLowerCase();
    }

    if (!this.collection) return cb(new Error('No collection specified'));

    this.store.collection(this.collection).findById(id, params.query, cb);
  },

  // TODO (EK): Batch support for create, update, delete.
  create: function (data, params, cb) {
    if (_.isFunction(params)){
      cb = params;
      params = {};
    }

    if (!this.collection) return cb(new Error('No collection specified'));

    this.store.collection(this.collection).insert(data, params, cb);
  },

  // TODO (EK): Return the updated document(s)
  update: function (id, data, params, cb) {
    if (_.isFunction(params)){
      cb = params;
      params = {};
    }

    if (!this.collection) return cb(new Error('No collection specified'));

    this.store.collection(this.collection).updateById(id, data, params, cb);
  },

  // TODO (EK): Return destroyed document(s)
  destroy: function (id, params, cb) {
    if (_.isFunction(params)){
      cb = params;
      params = {};
    }

    if (!this.collection) return cb(new Error('No collection specified'));

    this.store.collection(this.collection).removeById(id, params.query, cb);
  }
});

module.exports = MongoService;
