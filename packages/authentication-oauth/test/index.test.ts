import { strict as assert } from 'assert';
import { setup } from '../src';

describe('@feathersjs/authentication-oauth', () => {
  it('initializes', () => {
    assert.equal(typeof setup, 'function');
  });
});
