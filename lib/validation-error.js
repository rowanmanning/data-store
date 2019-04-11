'use strict';

/**
 * Represents a validation error.
 */
class ValidationError extends Error {

	/**
	 * Class constructor.
	 *
	 * @param {String} message
	 *     The error message.
	 * @param {Object} [details={}]
	 *     Additional information to store on the error.
	 */
	constructor(message, details = {}) {
		super(message);
		this.details = details;
		this.name = 'ValidationError';
	}

}

module.exports = ValidationError;
