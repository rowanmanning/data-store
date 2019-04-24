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
	 * @param {Object} [code='PROPERTY_VALIDATION']
	 *     The error code, for identifying the type of error thrown.
	 */
	constructor(message, details = {}, code = 'PROPERTY_VALIDATION') {
		super(message);
		this.details = details;
		this.code = code;
		this.name = 'ValidationError';
	}

}

module.exports = ValidationError;
