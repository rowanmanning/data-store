/**
 * @rowanmanning/data-store module
 * @module @rowanmanning/data-store
 */
'use strict';

const ValidationError = require('./validation-error');
const varname = require('varname');

/**
 * Represents a data store.
 */
class DataStore {

	/**
	 * Class constructor.
	 *
	 * @access public
	 * @param {(Object|DataStore)} [data={}]
	 *     Initial data to store.
	 * @throws {TypeError}
	 *     Throws if the data is not a valid object or DataStore instance.
	 */
	constructor(data = {}) {
		if (typeof data !== 'object' || Array.isArray(data) || data === null) {
			throw new TypeError('DataStore data must be an object');
		}
		if (data instanceof DataStore) {
			data = data.serialize();
		}
		this.data = {};
		this.set(data);
	}

	/**
	 * Get the value of a property, normalizing the property name
	 * and using getter methods if they exist.
	 *
	 * @access public
	 * @param {String} property
	 *     The property to get the value of.
	 * @returns {*}
	 *     Returns the requested value.
	 * @throws {TypeError}
	 *     Throws if the property name is not valid.
	 */
	get(property) {
		if (typeof property !== 'string') {
			throw new TypeError('property name must be a string');
		}

		// If a getter exists, call and return it
		const getter = `get${varname.camelcase(property)}`;
		if (this[getter] && typeof this[getter] === 'function') {
			return this[getter]();
		}

		const normalizedProperty = this.constructor.normalizePropertyForStorage(property);
		return this.data[normalizedProperty];
	}

	/**
	 * Set the value of a property (or multiple properties), normalizing
	 * the property names and using setter methods if they exist.
	 *
	 * @access public
	 * @param {(String|Object)} property
	 *     The property to set the value of, or an object with properties and values.
	 * @param {*} [value]
	 *     The value to set.
	 * @returns {*}
	 *     Returns the set value.
	 * @throws {TypeError}
	 *     Throws if the property name or value is not valid.
	 */
	set(property, value) {
		if (arguments.length === 1) {
			return this._setMany(property);
		}
		return this._setOne(property, value);
	}

	/**
	 * Set the value of a property, normalizing the property name
	 * and using setter methods if they exist.
	 *
	 * @access private
	 * @param {String} property
	 *     The property to set the value of.
	 * @param {*} value
	 *     The value to set.
	 * @returns {*}
	 *     Returns the set value.
	 * @throws {TypeError}
	 *     Throws if the property name or value is not valid.
	 */
	_setOne(property, value) {
		if (typeof property !== 'string') {
			throw new TypeError('property name must be a string');
		}

		const propertyCamelCase = varname.camelcase(property);
		const normalizedProperty = this.constructor.normalizePropertyForStorage(property);

		if (!this.constructor.isAllowedProperty(normalizedProperty)) {
			const classAndProperty = `${this.constructor.name}.${normalizedProperty}`;
			this.invalidate(`${classAndProperty} is not an allowed property name`);
		}

		// If a validator exists, call it
		const validator = `validate${propertyCamelCase}`;
		if (this[validator] && typeof this[validator] === 'function') {
			this[validator](value);
		}

		// If a setter exists, call and return it
		const setter = `set${propertyCamelCase}`;
		if (this[setter] && typeof this[setter] === 'function') {
			return this[setter](value);
		}

		this.data[normalizedProperty] = value;
		return value;
	}

	/**
	 * Set the value of multiple properties, normalizing the property
	 * names and using setter methods if they exist.
	 *
	 * @access private
	 * @param {Object} properties
	 *     The properties to set the value of.
	 * @returns {Object}
	 *     Returns the set properties and values.
	 * @throws {TypeError}
	 *     Throws if any of the properties are invalid.
	 */
	_setMany(properties) {
		if (typeof properties !== 'object' || Array.isArray(properties) || properties === null) {
			throw new TypeError('properties must be an object');
		}
		for (const [property, value] of Object.entries(properties)) {
			this._setOne(property, value);
		}
		return properties;
	}

	/**
	 * Throw a validation error.
	 *
	 * @access public
	 * @param {String} message
	 *     The error message.
	 * @param {Object} [details={}]
	 *     Additional information to store on the error.
	 * @returns {undefined}
	 *     Returns nothing.
	 * @throws {ValidationError}
	 *     Throws a validation error with the given message and details.
	 */
	invalidate(message, details) {
		throw new ValidationError(message, details);
	}

	/**
	 * Get a JSON-serializable copy of the data in the store.
	 *
	 * @access public
	 * @returns {Object}
	 *     Returns an object representation of the data store,
	 *     using getters to access properties if necessary.
	 */
	serialize() {
		const entries = Object.keys(this.data).map(property => {
			return [property, this.get(property)];
		});
		return entries.reduce((result, [property, value]) => {
			const normalizedProperty = this.constructor.normalizePropertyForSerialization(property);
			result[normalizedProperty] = value;
			return result;
		}, {});
	}

	/**
	 * Alias of {@link DataStore#serialize}
	 *
	 * @access public
	 * @returns {Object}
	 *     Returns an JSON-serialized representation of the data store.
	 */
	toJSON() {
		return this.serialize();
	}

	/**
	 * Create a DataStore instance, or multiple DataStore instances.
	 *
	 * @access public
	 * @param {(Object|Array<Object>)} data
	 *     The initial data to store. If this is an array, then each item in
	 *     the array will be used to create a separate DataStore instance.
	 * @returns {(DataStore|Array<DataStore>)}
	 *     Returns a single data store if `data` is an object, or an
	 *     array of data stores if `data` is an array.
	 * @throws {TypeError}
	 *     Throws if the data is not an object or an array of objects.
	 */
	static create(data) {
		if (Array.isArray(data)) {
			return data.map(item => new this(item));
		}
		return new this(data);
	}

	/**
	 * Get a JSON-serializable copy of a DataStore instance, or
	 * multiple DataStore instances.
	 *
	 * @access public
	 * @param {(DataStore|Array<DataStore>)} dataStore
	 *     The data store(s) to serialize. If this is an array, then each
	 *     item in the array will be serialized separately.
	 * @returns {(Object|Array<Object>)}
	 *     Returns an object representation of the data store,
	 *     using getters to access properties if necessary. Or an array
	 *     of object representations for each given data store if `data`
	 *     is an array.
	 * @throws {TypeError}
	 *     Throws if `dataStore` is not a DataStore instance or an array
	 *     of DataStore instances.
	 */
	static serialize(dataStore) {
		if (Array.isArray(dataStore)) {
			return dataStore.map(item => this.serialize(item));
		}
		if (!(dataStore instanceof DataStore)) {
			throw new TypeError('dataStore argument must be an instance of DataStore');
		}
		return dataStore.serialize();
	}

	/**
	 * Normalize a property name for serialization.
	 * Used internally by {@link DataStore#serialize}.
	 *
	 * @access public
	 * @param {String} property
	 *     The property name to normalize.
	 * @returns {String}
	 *     Returns the normalized property name.
	 */
	static normalizePropertyForSerialization(property) {
		return property;
	}

	/**
	 * Normalize a property name for storage in the data store.
	 * Used internally by {@link DataStore#constructor},
	 * {@link DataStore#get}, and {@link DataStore#set}.
	 *
	 * @access public
	 * @param {String} property
	 *     The property name to normalize.
	 * @returns {String}
	 *     Returns the normalized property name.
	 */
	static normalizePropertyForStorage(property) {
		return varname.camelback(property);
	}

	/**
	 * Check whether a property name is allowed.
	 *
	 * @access public
	 * @param {String} normalizedProperty
	 *     The pre-normalized property name to validate.
	 * @returns {Boolean}
	 *     Returns `true` if the property is allowed.
	 */
	static isAllowedProperty(normalizedProperty) {
		const allowedProperties = this.allowedProperties;
		const disallowedProperties = this.disallowedProperties;
		if (!allowedProperties && !disallowedProperties) {
			return true;
		}
		if (allowedProperties && !allowedProperties.includes(normalizedProperty)) {
			return false;
		}
		if (disallowedProperties && disallowedProperties.includes(normalizedProperty)) {
			return false;
		}
		return true;
	}

}

/**
 * A reference to the {@link ValidationError} class.
 *
 * @access public
 * @type {Function}
 */
DataStore.ValidationError = ValidationError;

module.exports = DataStore;
