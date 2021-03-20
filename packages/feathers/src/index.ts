import { _ } from '@feathersjs/commons';

import version from './version';
import { Feathers } from './application';
import { Application } from './declarations';

export function feathers<T = any, S = any> () {
  return new Feathers<T, S>() as Application<T, S>;
}

export { version, Feathers };
export * from './declarations';
export * from './service';
export * from './hooks';

if (typeof module !== 'undefined') {
  module.exports = Object.assign(feathers, module.exports);
}
