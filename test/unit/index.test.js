'use strict';

const index = require('../../index');
const DataStore = require('../../lib/data-store');

describe('index', () => {

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('aliases `lib/data-store`', () => {
		expect(index).toStrictEqual(DataStore);
	});

});
