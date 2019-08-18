'use strict';

const assert = require('proclaim');

describe('index', () => {
	let index;
	let DataStore;

	beforeEach(() => {
		index = require('../../index');
		DataStore = require('../../lib/data-store');
	});

	it('aliases `lib/data-store`', () => {
		assert.strictEqual(index, DataStore);
	});

});
