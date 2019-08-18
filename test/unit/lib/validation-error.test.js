'use strict';

const assert = require('proclaim');

describe('lib/validation-error', () => {
	let ValidationError;

	beforeEach(() => {
		ValidationError = require('../../../lib/validation-error');
	});

	describe('new ValidationError(message, details, code)', () => {
		let code;
		let details;
		let instance;

		beforeEach(() => {
			code = 'MOCK_CODE';
			details = {mockDetails: true};
			instance = new ValidationError('mock message', details, code);
		});

		it('extends `Error`', () => {
			assert.isInstanceOf(instance, Error);
		});

		describe('.name', () => {

			it('is set to "ValidationError"', () => {
				assert.strictEqual(instance.name, 'ValidationError');
			});

		});

		describe('.message', () => {

			it('is set to `message`', () => {
				assert.strictEqual(instance.message, 'mock message');
			});

		});

		describe('.details', () => {

			it('is set to `details`', () => {
				assert.strictEqual(instance.details, details);
			});

		});

		describe('.code', () => {

			it('is set to `code`', () => {
				assert.strictEqual(instance.code, code);
			});

		});

		describe('when `details` is undefined', () => {

			beforeEach(() => {
				instance = new ValidationError('mock message');
			});

			describe('.details', () => {

				it('is set to an empty object', () => {
					assert.deepEqual(instance.details, {});
				});

			});

		});

		describe('when `code` is undefined', () => {

			beforeEach(() => {
				instance = new ValidationError('mock message', details);
			});

			describe('.code', () => {

				it('is set to a default value', () => {
					assert.strictEqual(instance.code, 'PROPERTY_VALIDATION');
				});

			});

		});

	});

});
