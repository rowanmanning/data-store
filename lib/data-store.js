/**
 * @rowanmanning/data-store module
 * @module @rowanmanning/data-store
 */
'use strict';

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
			data = data.raw();
		}
		this.data = Object.entries(data).reduce((result, [property, value]) => {
			const normalizedProperty = this.constructor.normalizePropertyForStorage(property);
			result[normalizedProperty] = value;
			return result;
		}, {});
	}

	/**
	 * Get the raw data in this store.
	 *
	 * @access public
	 * @returns {Object}
	 *     Returns the raw data.
	 */
	raw() {
		return this.data;
	}

	/**
	 * Get the value of a property, normalizing the property name
	 * and using getter methods if they exist.
	 *
	 * @async
	 * @access public
	 * @param {String} property
	 *     The property to get the value of.
	 * @returns {Promise<*>}
	 *     Resolves with the requested value.
	 * @throws {TypeError}
	 *     Throws if the property name is not valid.
	 */
	async get(property) {
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
	 * @async
	 * @access public
	 * @param {(String|Object)} property
	 *     The property to set the value of, or an object with properties and values.
	 * @param {*} [value]
	 *     The value to set.
	 * @returns {Promise<*>}
	 *     Resolves with the set value.
	 * @throws {TypeError}
	 *     Throws if the property name is not valid.
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
	 * @async
	 * @access private
	 * @param {String} property
	 *     The property to set the value of.
	 * @param {*} value
	 *     The value to set.
	 * @returns {Promise<*>}
	 *     Resolves with the set value.
	 * @throws {TypeError}
	 *     Throws if the property name is not valid.
	 */
	async _setOne(property, value) {
		if (typeof property !== 'string') {
			throw new TypeError('property name must be a string');
		}

		// If a setter exists, call and return it
		const setter = `set${varname.camelcase(property)}`;
		if (this[setter] && typeof this[setter] === 'function') {
			return this[setter](value);
		}

		const normalizedProperty = this.constructor.normalizePropertyForStorage(property);
		this.data[normalizedProperty] = value;
		return value;
	}

	/**
	 * Set the value of multiple properties, normalizing the property
	 * names and using setter methods if they exist.
	 *
	 * @async
	 * @access private
	 * @param {Object} properties
	 *     The properties to set the value of.
	 * @returns {Promise<Object>}
	 *     Resolves with the set properties and values.
	 * @throws {TypeError}
	 *     Throws if the properties are invalid.
	 */
	async _setMany(properties) {
		if (typeof properties !== 'object' || Array.isArray(properties) || properties === null) {
			throw new TypeError('properties must be an object');
		}
		await Promise.all(Object.entries(properties).map(([property, value]) => {
			return this._setOne(property, value);
		}));
		return properties;
	}

	/**
	 * Get a JSON-serializable copy of the data in the store.
	 *
	 * @async
	 * @access public
	 * @returns {Promise<Object>}
	 *     Resolves with an object representation of the data store,
	 *     using getters to access properties if necessary.
	 */
	async serialize() {
		const entries = await Promise.all(
			Object.keys(this.data).map(async property => {
				return [property, await this.get(property)];
			})
		);
		return entries.reduce((result, [property, value]) => {
			const normalizedProperty = this.constructor.normalizePropertyForSerialization(property);
			result[normalizedProperty] = value;
			return result;
		}, {});
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
	 * @async
	 * @access public
	 * @param {(DataStore|Array<DataStore>)} dataStore
	 *     The data store(s) to serialize. If this is an array, then each
	 *     item in the array will be serialized separately.
	 * @returns {(Promise<Object>|Promise<Array<Object>>)}
	 *     Resolves with an object representation of the data store,
	 *     using getters to access properties if necessary. Or an array
	 *     of object representations for each given data store if `data`
	 *     is an array.
	 * @throws {TypeError}
	 *     Throws if `dataStore` is not a DataStore instance or an array
	 *     of DataStore instances.
	 */
	static async serialize(dataStore) {
		if (Array.isArray(dataStore)) {
			return Promise.all(dataStore.map(item => this.serialize(item)));
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

}

module.exports = DataStore;