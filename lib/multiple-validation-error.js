'use strict';

const ValidationError = require('./validation-error');

/**
 * Represents multiple validation errors.
 */
class MultipleValidationError extends Error {

	/**
	 * Class constructor.
	 *
	 * @param {Array<ValidationError>} validationErrors
	 *     The validation errors.
	 */
	constructor(validationErrors) {
		super(`${validationErrors.length} validation errors`);
		this.validationErrors = validationErrors.filter(error => error instanceof ValidationError);
		this.name = 'MultipleValidationError';
	}

}

module.exports = MultipleValidationError;
