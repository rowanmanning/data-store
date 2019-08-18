'use strict';

const assert = require('proclaim');

describe('lib/multiple-validation-error', () => {
	let MultipleValidationError;
	let ValidationError;

	beforeEach(() => {
		ValidationError = require('../../../lib/validation-error');
		MultipleValidationError = require('../../../lib/multiple-validation-error');
	});

	describe('new MultipleValidationError(validationErrors)', () => {
		let validationErrors;
		let instance;

		beforeEach(() => {
			validationErrors = [
				new ValidationError('mock validation error 1'),
				new ValidationError('mock validation error 2'),
				new ValidationError('mock validation error 3')
			];
			instance = new MultipleValidationError(validationErrors);
		});

		it('extends `Error`', () => {
			assert.isInstanceOf(instance, Error);
		});

		describe('.name', () => {

			it('is set to "MultipleValidationError"', () => {
				assert.strictEqual(instance.name, 'MultipleValidationError');
			});

		});

		describe('.message', () => {

			it('is set to a generated message based on `validationErrors`', () => {
				assert.strictEqual(instance.message, '3 validation errors');
			});

		});

		describe('.validationErrors', () => {

			it('is set to the passed in errors', () => {
				assert.deepEqual(instance.validationErrors, validationErrors);
			});

		});

		describe('when `validationErrors` contains a non ValidationError instance', () => {

			beforeEach(() => {
				validationErrors = [
					new ValidationError('mock validation error 1'),
					new TypeError('mock validation error 2'),
					new Error('mock validation error 3')
				];
				instance = new MultipleValidationError(validationErrors);
			});

			describe('.validationErrors', () => {

				it('is set to an array containing only the ValidationError instances', () => {
					assert.deepEqual(instance.validationErrors, [
						validationErrors[0]
					]);
				});

			});

		});

	});

});
