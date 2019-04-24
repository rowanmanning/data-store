'use strict';

describe('lib/multiple-validation-error', () => {
	let MultipleValidationError;
	let ValidationError;

	beforeEach(() => {
		jest.resetModules();
		ValidationError = require('../../../lib/validation-error');
		MultipleValidationError = require('../../../lib/multiple-validation-error');
	});

	afterEach(() => {
		jest.clearAllMocks();
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
			expect(instance).toBeInstanceOf(Error);
		});

		describe('.name', () => {

			it('is set to "MultipleValidationError"', () => {
				expect(instance.name).toStrictEqual('MultipleValidationError');
			});

		});

		describe('.message', () => {

			it('is set to a generated message based on `validationErrors`', () => {
				expect(instance.message).toStrictEqual('3 validation errors');
			});

		});

		describe('.validationErrors', () => {

			it('is set to the passed in errors', () => {
				expect(instance.validationErrors).toStrictEqual(validationErrors);
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
					expect(instance.validationErrors).toStrictEqual([
						validationErrors[0]
					]);
				});

			});

		});

	});

});
