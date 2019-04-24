'use strict';

describe('lib/validation-error', () => {
	let ValidationError;

	beforeEach(() => {
		jest.resetModules();
		ValidationError = require('../../../lib/validation-error');
	});

	afterEach(() => {
		jest.clearAllMocks();
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
			expect(instance).toBeInstanceOf(Error);
		});

		describe('.name', () => {

			it('is set to "ValidationError"', () => {
				expect(instance.name).toStrictEqual('ValidationError');
			});

		});

		describe('.message', () => {

			it('is set to `message`', () => {
				expect(instance.message).toStrictEqual('mock message');
			});

		});

		describe('.details', () => {

			it('is set to `details`', () => {
				expect(instance.details).toStrictEqual(details);
			});

		});

		describe('.code', () => {

			it('is set to `code`', () => {
				expect(instance.code).toStrictEqual(code);
			});

		});

		describe('when `details` is undefined', () => {

			beforeEach(() => {
				instance = new ValidationError('mock message');
			});

			describe('.details', () => {

				it('is set to an empty object', () => {
					expect(instance.details).toStrictEqual({});
				});

			});

		});

		describe('when `code` is undefined', () => {

			beforeEach(() => {
				instance = new ValidationError('mock message', details);
			});

			describe('.code', () => {

				it('is set to a default value', () => {
					expect(instance.code).toStrictEqual('PROPERTY_VALIDATION');
				});

			});

		});

	});

});
