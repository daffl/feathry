import { createSymbol } from '@feathersjs/commons';

import { ServiceOptions } from './declarations';

export const SERVICE = createSymbol('@feathersjs/service');

export const defaultServiceArguments = {
  find: [ 'params' ],
  get: [ 'id', 'params' ],
  create: [ 'data', 'params' ],
  update: [ 'id', 'data', 'params' ],
  patch: [ 'id', 'data', 'params' ],
  remove: [ 'id', 'params' ]
}

export const defaultServiceMethods = Object.keys(defaultServiceArguments).concat('setup');

export const defaultEventMap = {
  create: 'created',
  update: 'updated',
  patch: 'patched',
  remove: 'removed'
}

export function getServiceOptions (
  service: any, options: ServiceOptions = {}
): ServiceOptions {
  const existingOptions = service[SERVICE];

  if (existingOptions) {
    return existingOptions;
  }

  const {
    methods = defaultServiceMethods.filter(method =>
      typeof service[method] === 'function'
    ),
    events = service.events || []
  } = options;
  const {
    serviceEvents = Object.values(defaultEventMap).concat(events)
  } = options;

  return {
    ...options,
    events,
    methods,
    serviceEvents
  };
}

export function wrapService (
  location: string, service: any, options: ServiceOptions
) {
  // Do nothing if this is already an initialized
  if (service[SERVICE]) {
    return service;
  }

  const protoService = Object.create(service);
  const serviceOptions = getServiceOptions(service, options);

  if (Object.keys(serviceOptions.methods).length === 0) {
    throw new Error(`Invalid service object passed for path \`${location}\``);
  }

  Object.defineProperty(protoService, SERVICE, {
    value: serviceOptions
  });

  return protoService;
}
