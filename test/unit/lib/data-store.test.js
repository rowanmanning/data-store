'use strict';

describe('lib/data-store', () => {
	let DataStore;
	let MultipleValidationError;
	let ValidationError;
	let varname;

	beforeEach(() => {
		jest.resetModules();
		MultipleValidationError = require('../../../lib/multiple-validation-error');
		ValidationError = require('../../../lib/validation-error');
		varname = require('varname');
		DataStore = require('../../../lib/data-store');
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('new DataStore(data)', () => {
		let data;
		let instance;

		beforeEach(() => {
			jest.spyOn(DataStore, 'normalizePropertyForStorage')
				.mockReturnValueOnce('mockNormalizedProperty1')
				.mockReturnValueOnce('mockNormalizedProperty2');
			jest.spyOn(DataStore, 'isAllowedProperty').mockReturnValue(true);
			data = {
				mockProperty1: 'mock value 1',
				mockProperty2: 'mock value 2'
			};
			instance = new DataStore(data);
		});

		it('calls `DataStore.normalizePropertyForStorage` with each property', () => {
			expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledTimes(2);
			expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledWith('mockProperty1');
			expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledWith('mockProperty2');
		});

		describe('.data', () => {

			it('is an object', () => {
				expect(typeof instance.data).toStrictEqual('object');
				expect(instance.data).not.toBeNull();
			});

			it('is made up of normalised properties and values', () => {
				expect(instance.data).toStrictEqual({
					mockNormalizedProperty1: 'mock value 1',
					mockNormalizedProperty2: 'mock value 2'
				});
			});

		});

		describe('.get(property)', () => {
			let returnValue;

			beforeEach(() => {
				DataStore.normalizePropertyForStorage.mockClear();
				DataStore.normalizePropertyForStorage.mockReturnValue('mockNormalizedProperty1');
				instance.data = {
					mockNormalizedProperty1: 'mock value 1'
				};
				returnValue = instance.get('mockProperty1');
			});

			it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
				expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledTimes(1);
				expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledWith('mockProperty1');
			});

			it('returns the property value', () => {
				expect(returnValue).toStrictEqual('mock value 1');
			});

			describe('when `property` has a corresponding getter function', () => {

				beforeEach(() => {
					DataStore.normalizePropertyForStorage.mockClear();
					instance.data = {};
					instance.getMockProperty1 = jest.fn().mockReturnValue('mock value 1');
					returnValue = instance.get('mockProperty1');
				});

				it('does not call `DataStore.normalizePropertyForStorage`', () => {
					expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledTimes(0);
				});

				it('calls the getter function', () => {
					expect(instance.getMockProperty1).toHaveBeenCalledTimes(1);
					expect(instance.getMockProperty1).toHaveBeenCalledWith();
				});

				it('returns the getter return value', () => {
					expect(returnValue).toStrictEqual('mock value 1');
				});

			});

			describe('when `property` has a corresponding getter which is not a function', () => {

				beforeEach(() => {
					DataStore.normalizePropertyForStorage.mockClear();
					DataStore.normalizePropertyForStorage.mockReturnValue('mockNormalizedProperty1');
					instance.data = {
						mockNormalizedProperty1: 'mock value 1'
					};
					instance.getMockProperty1 = 'not a function';
					returnValue = instance.get('mockProperty1');
				});

				it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
					expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledTimes(1);
					expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledWith('mockProperty1');
				});

				it('returns the property value', () => {
					expect(returnValue).toStrictEqual('mock value 1');
				});

			});

			describe('when `property` is not a string', () => {

				it('throws an error', () => {
					const expectedError = new TypeError('property name must be a string');
					expect(() => instance.get(123)).toThrow(expectedError);
					expect(() => instance.get([])).toThrow(expectedError);
					expect(() => instance.get(null)).toThrow(expectedError);
				});

			});

		});

		describe('.set(property, value)', () => {
			let returnValue;

			beforeEach(() => {
				jest.spyOn(instance, '_setOne').mockReturnValue('set one return');
				jest.spyOn(instance, '_setMany').mockReturnValue('set many return');
				instance.data = {};
				returnValue = instance.set('mockProperty1', 'mock value 1');
			});

			it('calls the `_setOne` method with the property and value', () => {
				expect(instance._setOne).toHaveBeenCalledTimes(1);
				expect(instance._setOne).toHaveBeenCalledWith('mockProperty1', 'mock value 1');
			});

			it('does not call the `_setMany` method', () => {
				expect(instance._setMany).toHaveBeenCalledTimes(0);
			});

			it('returns the set property', () => {
				expect(returnValue).toStrictEqual('set one return');
			});

		});

		describe('.set(properties)', () => {
			let returnValue;

			beforeEach(() => {
				jest.spyOn(instance, '_setOne').mockReturnValue('set one return');
				jest.spyOn(instance, '_setMany').mockReturnValue('set many return');
				instance.data = {};
				returnValue = instance.set({
					mockProperty1: 'mock value 1',
					mockProperty2: 'mock value 2'
				});
			});

			it('calls the `_setMany` method with the properties', () => {
				expect(instance._setMany).toHaveBeenCalledTimes(1);
				expect(instance._setMany).toHaveBeenCalledWith({
					mockProperty1: 'mock value 1',
					mockProperty2: 'mock value 2'
				});
			});

			it('does not call the `_setOne` method', () => {
				expect(instance._setOne).toHaveBeenCalledTimes(0);
			});

			it('returns the set property', () => {
				expect(returnValue).toStrictEqual('set many return');
			});

		});

		describe('._setOne(property, value)', () => {
			let returnValue;

			beforeEach(() => {
				DataStore.isAllowedProperty.mockClear();
				DataStore.normalizePropertyForStorage.mockClear();
				DataStore.normalizePropertyForStorage.mockReturnValue('mockNormalizedProperty1');
				jest.spyOn(instance, 'invalidate').mockImplementation(() => {
					throw new Error('mock error');
				});
				instance.data = {};
				returnValue = instance._setOne('mockProperty1', 'mock value 1');
			});

			it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
				expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledTimes(1);
				expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledWith('mockProperty1');
			});

			it('checks that the property is allowed', () => {
				expect(DataStore.isAllowedProperty).toHaveBeenCalledTimes(1);
				expect(DataStore.isAllowedProperty).toHaveBeenCalledWith('mockNormalizedProperty1');
			});

			it('sets the specified property to the given value', () => {
				expect(instance.data.mockNormalizedProperty1).toStrictEqual('mock value 1');
			});

			it('returns the new value', () => {
				expect(returnValue).toStrictEqual('mock value 1');
			});

			describe('when `property` is not allowed', () => {
				let caughtError;

				beforeEach(() => {
					DataStore.isAllowedProperty.mockClear();
					DataStore.normalizePropertyForStorage.mockClear();
					instance.data = {};
					DataStore.isAllowedProperty.mockReturnValue(false);
					try {
						instance._setOne('mockProperty1', 'mock value 1');
					} catch (error) {
						caughtError = error;
					}
				});

				it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
					expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledTimes(1);
					expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledWith('mockProperty1');
				});

				it('checks that the property is allowed', () => {
					expect(DataStore.isAllowedProperty).toHaveBeenCalledTimes(1);
					expect(DataStore.isAllowedProperty).toHaveBeenCalledWith('mockNormalizedProperty1');
				});

				it('does not set the property', () => {
					expect(instance.data.mockNormalizedProperty1).toBeUndefined();
				});

				it('throws a validation error', () => {
					expect(instance.invalidate).toHaveBeenCalledTimes(1);
					expect(instance.invalidate).toHaveBeenCalledWith('DataStore.mockNormalizedProperty1 is not an allowed property name', {}, 'DISALLOWED_PROPERTY');
					expect(caughtError).toStrictEqual(instance.invalidate.mock.results[0].value);
				});

			});

			describe('when `property` has a corresponding validator function', () => {

				beforeEach(() => {
					DataStore.isAllowedProperty.mockClear();
					DataStore.normalizePropertyForStorage.mockClear();
					instance.data = {};
					instance.validateMockProperty1 = jest.fn().mockReturnValue('mock validator return');
					returnValue = instance._setOne('mockProperty1', 'mock value 1');
				});

				it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
					expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledTimes(1);
					expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledWith('mockProperty1');
				});

				it('checks that the property is allowed', () => {
					expect(DataStore.isAllowedProperty).toHaveBeenCalledTimes(1);
					expect(DataStore.isAllowedProperty).toHaveBeenCalledWith('mockNormalizedProperty1');
				});

				it('validates the property value using the validator', () => {
					expect(instance.validateMockProperty1).toHaveBeenCalledTimes(1);
					expect(instance.validateMockProperty1).toHaveBeenCalledWith('mock value 1');
				});

				it('sets the specified property to the given value', () => {
					expect(instance.data.mockNormalizedProperty1).toStrictEqual('mock value 1');
				});

				it('returns the new value', () => {
					expect(returnValue).toStrictEqual('mock value 1');
				});

			});

			describe('when `property` has a corresponding validator function that throws', () => {
				let caughtError;
				let validationError;

				beforeEach(() => {
					DataStore.isAllowedProperty.mockClear();
					DataStore.normalizePropertyForStorage.mockClear();
					instance.data = {};
					validationError = new Error('mock validation error');
					instance.validateMockProperty1 = jest.fn().mockImplementation(() => {
						throw validationError;
					});
					try {
						instance._setOne('mockProperty1', 'mock value 1');
					} catch (error) {
						caughtError = error;
					}
				});

				it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
					expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledTimes(1);
					expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledWith('mockProperty1');
				});

				it('checks that the property is allowed', () => {
					expect(DataStore.isAllowedProperty).toHaveBeenCalledTimes(1);
					expect(DataStore.isAllowedProperty).toHaveBeenCalledWith('mockNormalizedProperty1');
				});

				it('validates the property value using the validator', () => {
					expect(instance.validateMockProperty1).toHaveBeenCalledTimes(1);
					expect(instance.validateMockProperty1).toHaveBeenCalledWith('mock value 1');
				});

				it('does not set the property', () => {
					expect(instance.data.mockNormalizedProperty1).toBeUndefined();
				});

				it('throws the validation error', () => {
					expect(caughtError).toStrictEqual(validationError);
				});

			});

			describe('when `property` has a corresponding setter function', () => {

				beforeEach(() => {
					DataStore.isAllowedProperty.mockClear();
					DataStore.normalizePropertyForStorage.mockClear();
					instance.data = {};
					instance.setMockProperty1 = jest.fn().mockReturnValue('mock setter return');
					returnValue = instance._setOne('mockProperty1', 'mock value 1');
				});

				it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
					expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledTimes(1);
					expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledWith('mockProperty1');
				});

				it('checks that the property is allowed', () => {
					expect(DataStore.isAllowedProperty).toHaveBeenCalledTimes(1);
					expect(DataStore.isAllowedProperty).toHaveBeenCalledWith('mockNormalizedProperty1');
				});

				it('calls the setter function with the value', () => {
					expect(instance.setMockProperty1).toHaveBeenCalledTimes(1);
					expect(instance.setMockProperty1).toHaveBeenCalledWith('mock value 1');
				});

				it('returns the setter return value', () => {
					expect(returnValue).toStrictEqual('mock setter return');
				});

			});

			describe('when `property` has a corresponding setter which is not a function', () => {

				beforeEach(() => {
					DataStore.isAllowedProperty.mockClear();
					DataStore.normalizePropertyForStorage.mockClear();
					instance.data = {};
					instance.setMockProperty1 = 'not a function';
					returnValue = instance._setOne('mockProperty1', 'mock value 1');
				});

				it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
					expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledTimes(1);
					expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledWith('mockProperty1');
				});

				it('checks that the property is allowed', () => {
					expect(DataStore.isAllowedProperty).toHaveBeenCalledTimes(1);
					expect(DataStore.isAllowedProperty).toHaveBeenCalledWith('mockNormalizedProperty1');
				});

				it('sets the specified property to the given value', () => {
					expect(instance.data.mockNormalizedProperty1).toStrictEqual('mock value 1');
				});

				it('returns the new value', () => {
					expect(returnValue).toStrictEqual('mock value 1');
				});

			});

			describe('when `property` is not a string', () => {

				it('throws an error', () => {
					const expectedError = new TypeError('property name must be a string');
					expect(() => instance._setOne(123, 'mock value 1')).toThrow(expectedError);
					expect(() => instance._setOne([], 'mock value 1')).toThrow(expectedError);
					expect(() => instance._setOne(null, 'mock value 1')).toThrow(expectedError);
				});

			});

		});

		describe('._setMany(properties)', () => {
			let returnValue;

			beforeEach(() => {
				jest.spyOn(instance, '_setOne').mockReturnValue('set one return');
				instance.data = {};
				returnValue = instance._setMany({
					mockProperty1: 'mock value 1',
					mockProperty2: 'mock value 2'
				});
			});

			it('calls the `_setOne` method with each property', () => {
				expect(instance._setOne).toHaveBeenCalledTimes(2);
				expect(instance._setOne).toHaveBeenCalledWith('mockProperty1', 'mock value 1');
				expect(instance._setOne).toHaveBeenCalledWith('mockProperty2', 'mock value 2');
			});

			it('returns the set properties', () => {
				expect(returnValue).toStrictEqual({
					mockProperty1: 'mock value 1',
					mockProperty2: 'mock value 2'
				});
			});

			describe('when `properties` is not an object', () => {

				it('throws an error', () => {
					const expectedError = new TypeError('properties must be an object');
					expect(() => instance._setMany(123)).toThrow(expectedError);
					expect(() => instance._setMany([])).toThrow(expectedError);
					expect(() => instance._setMany(null)).toThrow(expectedError);
				});

			});

			describe('when `_setOne` errors', () => {
				let caughtError;
				let validationError1;
				let validationError2;

				beforeEach(() => {
					validationError1 = new ValidationError('mock error 1');
					validationError2 = new ValidationError('mock error 2');
					instance._setOne.mockReset();
					instance._setOne.mockImplementationOnce(() => {
						throw validationError1;
					});
					instance._setOne.mockImplementationOnce(() => {
						throw validationError2;
					});
					try {
						instance._setMany({
							mockProperty1: 'mock value 1',
							mockProperty2: 'mock value 2'
						});
					} catch (error) {
						caughtError = error;
					}
				});

				it('throws a `MultipleValidationError` error containing the thrown errors', () => {
					expect(caughtError).toBeInstanceOf(MultipleValidationError);
					expect();
				});

			});

		});

		describe('.invalidate(message, details)', () => {
			let caughtError;

			beforeEach(() => {
				try {
					instance.invalidate('mock message', {
						mockDetails: true
					});
				} catch (error) {
					caughtError = error;
				}
			});

			it('throw a ValidationError with the expected arguments', () => {
				expect(caughtError).toBeInstanceOf(ValidationError);
				expect(caughtError.message).toStrictEqual('mock message');
				expect(caughtError.details).toStrictEqual({
					mockDetails: true
				});
			});

		});

		describe('.serialize()', () => {
			let returnValue;

			beforeEach(() => {
				jest.spyOn(instance, 'get')
					.mockReturnValueOnce('mock value 1')
					.mockReturnValueOnce('mock value 2');
				jest.spyOn(DataStore, 'normalizePropertyForSerialization')
					.mockReturnValueOnce('mockNormalizedProperty1')
					.mockReturnValueOnce('mockNormalizedProperty2');
				instance.data = {
					mockProperty1: 'mock value 1',
					mockProperty2: 'mock value 1'
				};
				returnValue = instance.serialize();
			});

			it('gets each property', () => {
				expect(instance.get).toHaveBeenCalledTimes(2);
				expect(instance.get).toHaveBeenCalledWith('mockProperty1');
				expect(instance.get).toHaveBeenCalledWith('mockProperty2');
			});

			it('calls `DataStore.normalizePropertyForSerialization` with each property in `instance.data`', () => {
				expect(DataStore.normalizePropertyForSerialization).toHaveBeenCalledTimes(2);
				expect(DataStore.normalizePropertyForSerialization).toHaveBeenCalledWith('mockProperty1');
				expect(DataStore.normalizePropertyForSerialization).toHaveBeenCalledWith('mockProperty2');
			});

			it('returns the serialized data', () => {
				expect(returnValue).toStrictEqual({
					mockNormalizedProperty1: 'mock value 1',
					mockNormalizedProperty2: 'mock value 2'
				});
			});

		});

		describe('.toJSON()', () => {
			let returnValue;

			beforeEach(() => {
				jest.spyOn(instance, 'serialize').mockReturnValue('mock serialized data');
				returnValue = instance.toJSON();
			});

			it('serializes the data store', () => {
				expect(instance.serialize).toHaveBeenCalledTimes(1);
				expect(instance.serialize).toHaveBeenCalledWith();
			});

			it('returns the serialized data', () => {
				expect(returnValue).toStrictEqual('mock serialized data');
			});

		});

		describe('when `data` is a DataStore instance', () => {
			let originalInstance;

			beforeEach(() => {
				originalInstance = new DataStore();
				jest.spyOn(originalInstance, 'serialize').mockReturnValue({
					mockProperty1: 'mock value 1',
					mockProperty2: 'mock value 2'
				});
				DataStore.normalizePropertyForStorage.mockClear();
				DataStore.normalizePropertyForStorage
					.mockReturnValueOnce('mockNormalizedProperty1')
					.mockReturnValueOnce('mockNormalizedProperty2');
				instance = new DataStore(originalInstance);
			});

			it('gets the serialized data from the original instance', () => {
				expect(originalInstance.serialize).toHaveBeenCalledTimes(1);
			});

			it('calls `DataStore.normalizePropertyForStorage` with each property', () => {
				expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledTimes(2);
				expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledWith('mockProperty1');
				expect(DataStore.normalizePropertyForStorage).toHaveBeenCalledWith('mockProperty2');
			});

			describe('.data', () => {

				it('is an object', () => {
					expect(typeof instance.data).toStrictEqual('object');
					expect(instance.data).not.toBeNull();
				});

				it('is made up of normalised properties and values equal to the original instance data', () => {
					expect(instance.data).toStrictEqual({
						mockNormalizedProperty1: 'mock value 1',
						mockNormalizedProperty2: 'mock value 2'
					});
				});

			});

		});

		describe('when `data` is not an object', () => {

			it('throws an error', () => {
				expect(() => new DataStore('nope')).toThrow(new TypeError('DataStore data must be an object'));
			});

		});

		describe('when `data` is an array', () => {

			it('throws an error', () => {
				expect(() => new DataStore([])).toThrow(new TypeError('DataStore data must be an object'));
			});

		});

		describe('when `data` is `null`', () => {

			it('throws an error', () => {
				expect(() => new DataStore(null)).toThrow(new TypeError('DataStore data must be an object'));
			});

		});

	});

	describe('.create(data)', () => {
		let data;
		let returnValue;

		beforeEach(() => {
			data = {
				mockProperty1: 'mock value 1'
			};
			returnValue = DataStore.create(data);
		});

		it('returns a new DataStore instance, which was instantiated with `data`', () => {
			expect(returnValue).toBeInstanceOf(DataStore);
			expect(returnValue.data).toStrictEqual(data);
		});

		describe('when `data` is an array of objects', () => {

			beforeEach(() => {
				data = [
					{
						mockProperty1: 'mock value 1'
					},
					{
						mockProperty2: 'mock value 2'
					}
				];
				returnValue = DataStore.create(data);
			});

			it('returns an array of new DataStore instances, which were instantiated with each object in `data`', () => {
				expect(returnValue).toBeInstanceOf(Array);
				expect(returnValue[0]).toBeInstanceOf(DataStore);
				expect(returnValue[0].data).toStrictEqual(data[0]);
				expect(returnValue[1]).toBeInstanceOf(DataStore);
				expect(returnValue[1].data).toStrictEqual(data[1]);
			});

		});

	});

	describe('.serialize(dataStore)', () => {
		let instance;
		let returnValue;

		beforeEach(() => {
			instance = new DataStore({
				mockProperty1: 'mock value 1'
			});
			jest.spyOn(instance, 'serialize').mockReturnValue('mock serialize 1');
			returnValue = DataStore.serialize(instance);
		});

		it('serializes the DataStore instance', () => {
			expect(instance.serialize).toHaveBeenCalledTimes(1);
			expect(instance.serialize).toHaveBeenCalledWith();
		});

		it('returns the serialized data', () => {
			expect(returnValue).toStrictEqual('mock serialize 1');
		});

		describe('when `dataStore` is an array of DataStore instances', () => {
			let instance1;
			let instance2;

			beforeEach(() => {
				instance1 = new DataStore();
				jest.spyOn(instance1, 'serialize').mockReturnValue('mock serialize 1');
				instance2 = new DataStore();
				jest.spyOn(instance2, 'serialize').mockReturnValue('mock serialize 2');
				returnValue = DataStore.serialize([
					instance1,
					instance2
				]);
			});

			it('serializes each DataStore instance', () => {
				expect(instance1.serialize).toHaveBeenCalledTimes(1);
				expect(instance1.serialize).toHaveBeenCalledWith();
				expect(instance2.serialize).toHaveBeenCalledTimes(1);
				expect(instance2.serialize).toHaveBeenCalledWith();
			});

			it('returns an array of serialized data', () => {
				expect(returnValue).toBeInstanceOf(Array);
				expect(returnValue[0]).toStrictEqual('mock serialize 1');
				expect(returnValue[1]).toStrictEqual('mock serialize 2');
			});

		});

		describe('when `dataStore` is not an instance of DataStore or an array', () => {

			it('throws an error', () => {
				const expectedError = new TypeError('dataStore argument must be an instance of DataStore');
				expect(() => DataStore.serialize(123)).toThrow(expectedError);
				expect(() => DataStore.serialize({})).toThrow(expectedError);
				expect(() => DataStore.serialize(null)).toThrow(expectedError);
			});

		});

		describe('when `dataStore` is an array which contains items which are not DataStore instances', () => {

			it('throws an error', () => {
				const expectedError = new TypeError('dataStore argument must be an instance of DataStore');
				expect(() => DataStore.serialize([123])).toThrow(expectedError);
				expect(() => DataStore.serialize([{}])).toThrow(expectedError);
				expect(() => DataStore.serialize([null])).toThrow(expectedError);
			});

		});

	});

	describe('.normalizePropertyForSerialization(property)', () => {
		let returnValue;

		beforeEach(() => {
			returnValue = DataStore.normalizePropertyForSerialization('mock-property-1');
		});

		it('returns the property as-is', () => {
			expect(returnValue).toStrictEqual('mock-property-1');
		});

	});

	describe('.normalizePropertyForStorage(property)', () => {
		let returnValue;

		beforeEach(() => {
			returnValue = DataStore.normalizePropertyForStorage('mock-property-1');
		});

		it('converts `property` to camelBack case', () => {
			expect(varname.camelback).toHaveBeenCalledTimes(1);
			expect(varname.camelback).toHaveBeenCalledWith('mock-property-1');
		});

		it('returns the converted property', () => {
			expect(returnValue).toStrictEqual(varname.camelback.mock.results[0].value);
		});

	});

	describe('.isAllowedProperty(normalizedProperty)', () => {
		let returnValue;

		beforeEach(() => {
			returnValue = DataStore.isAllowedProperty('mockProperty1');
		});

		afterEach(() => {
			delete DataStore.allowedProperties;
			delete DataStore.disallowedProperties;
		});

		it('returns `true`', () => {
			expect(returnValue).toStrictEqual(true);
		});

		describe('when the DataStore has an `allowedProperties` array which includes the property', () => {

			beforeEach(() => {
				DataStore.allowedProperties = ['mockProperty1'];
				returnValue = DataStore.isAllowedProperty('mockProperty1');
			});

			it('returns `true`', () => {
				expect(returnValue).toStrictEqual(true);
			});

		});

		describe('when the DataStore has an `allowedProperties` array which does not include the property', () => {

			beforeEach(() => {
				DataStore.allowedProperties = ['mockProperty2'];
				returnValue = DataStore.isAllowedProperty('mockProperty1');
			});

			it('returns `false`', () => {
				expect(returnValue).toStrictEqual(false);
			});

		});

		describe('when the DataStore has a `disallowedProperties` array which does not include the property', () => {

			beforeEach(() => {
				DataStore.disallowedProperties = ['mockProperty2'];
				returnValue = DataStore.isAllowedProperty('mockProperty1');
			});

			it('returns `true`', () => {
				expect(returnValue).toStrictEqual(true);
			});

		});

		describe('when the DataStore has a `disallowedProperties` array which does include the property', () => {

			beforeEach(() => {
				DataStore.disallowedProperties = ['mockProperty1'];
				returnValue = DataStore.isAllowedProperty('mockProperty1');
			});

			it('returns `false`', () => {
				expect(returnValue).toStrictEqual(false);
			});

		});

	});

	describe('.ValidationError', () => {

		it('aliases `lib/validation-error`', () => {
			expect(DataStore.ValidationError).toStrictEqual(ValidationError);
		});

	});

});
