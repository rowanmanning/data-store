'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/data-store', () => {
	let DataStore;
	let MultipleValidationError;
	let ValidationError;
	let varname;

	beforeEach(() => {
		MultipleValidationError = require('../../../lib/multiple-validation-error');
		ValidationError = require('../../../lib/validation-error');
		varname = require('../mock/npm/varname');
		mockery.registerMock('varname', varname);
		DataStore = require('../../../lib/data-store');
	});

	describe('new DataStore(data)', () => {
		let data;
		let instance;

		beforeEach(() => {
			sinon.stub(DataStore, 'normalizePropertyForStorage');
			DataStore.normalizePropertyForStorage.onCall(0).returns('mockNormalizedProperty1');
			DataStore.normalizePropertyForStorage.onCall(1).returns('mockNormalizedProperty2');
			sinon.stub(DataStore, 'isAllowedProperty').returns(true);
			data = {
				mockProperty1: 'mock value 1',
				mockProperty2: 'mock value 2'
			};
			instance = new DataStore(data);
		});

		it('calls `DataStore.normalizePropertyForStorage` with each property', () => {
			assert.calledTwice(DataStore.normalizePropertyForStorage);
			assert.calledWith(DataStore.normalizePropertyForStorage, 'mockProperty1');
			assert.calledWith(DataStore.normalizePropertyForStorage, 'mockProperty2');
		});

		describe('.data', () => {

			it('is an object', () => {
				assert.isObject(instance.data);
				assert.isNotNull(instance.data);
			});

			it('is made up of normalised properties and values', () => {
				assert.deepEqual(instance.data, {
					mockNormalizedProperty1: 'mock value 1',
					mockNormalizedProperty2: 'mock value 2'
				});
			});

		});

		describe('.get(property)', () => {
			let returnValue;

			beforeEach(() => {
				DataStore.normalizePropertyForStorage.resetHistory();
				DataStore.normalizePropertyForStorage.returns('mockNormalizedProperty1');
				instance.data = {
					mockNormalizedProperty1: 'mock value 1'
				};
				returnValue = instance.get('mockProperty1');
			});

			it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
				assert.calledOnce(DataStore.normalizePropertyForStorage);
				assert.calledWith(DataStore.normalizePropertyForStorage, 'mockProperty1');
			});

			it('returns the property value', () => {
				assert.strictEqual(returnValue, 'mock value 1');
			});

			describe('when `property` has a corresponding getter function', () => {

				beforeEach(() => {
					DataStore.normalizePropertyForStorage.resetHistory();
					instance.data = {};
					instance.getMockProperty1 = sinon.stub().returns('mock value 1');
					returnValue = instance.get('mockProperty1');
				});

				it('does not call `DataStore.normalizePropertyForStorage`', () => {
					assert.notCalled(DataStore.normalizePropertyForStorage);
				});

				it('calls the getter function', () => {
					assert.calledOnce(instance.getMockProperty1);
					assert.calledWithExactly(instance.getMockProperty1);
				});

				it('returns the getter return value', () => {
					assert.strictEqual(returnValue, 'mock value 1');
				});

			});

			describe('when `property` has a corresponding getter which is not a function', () => {

				beforeEach(() => {
					DataStore.normalizePropertyForStorage.resetHistory();
					DataStore.normalizePropertyForStorage.returns('mockNormalizedProperty1');
					instance.data = {
						mockNormalizedProperty1: 'mock value 1'
					};
					instance.getMockProperty1 = 'not a function';
					returnValue = instance.get('mockProperty1');
				});

				it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
					assert.calledOnce(DataStore.normalizePropertyForStorage);
					assert.calledWith(DataStore.normalizePropertyForStorage, 'mockProperty1');
				});

				it('returns the property value', () => {
					assert.strictEqual(returnValue, 'mock value 1');
				});

			});

			describe('when `property` is not a string', () => {

				it('throws an error', () => {
					const expectedErrorMessage = 'property name must be a string';
					assert.throws(() => instance.get(123), expectedErrorMessage);
					assert.throws(() => instance.get([]), expectedErrorMessage);
					assert.throws(() => instance.get(null), expectedErrorMessage);
				});

			});

		});

		describe('.set(property, value)', () => {
			let returnValue;

			beforeEach(() => {
				sinon.stub(instance, '_setOne').returns('set one return');
				sinon.stub(instance, '_setMany').returns('set many return');
				instance.data = {};
				returnValue = instance.set('mockProperty1', 'mock value 1');
			});

			it('calls the `_setOne` method with the property and value', () => {
				assert.calledOnce(instance._setOne);
				assert.calledWith(instance._setOne, 'mockProperty1', 'mock value 1');
			});

			it('does not call the `_setMany` method', () => {
				assert.notCalled(instance._setMany);
			});

			it('returns the set property', () => {
				assert.strictEqual(returnValue, 'set one return');
			});

		});

		describe('.set(properties)', () => {
			let returnValue;

			beforeEach(() => {
				sinon.stub(instance, '_setOne').returns('set one return');
				sinon.stub(instance, '_setMany').returns('set many return');
				instance.data = {};
				returnValue = instance.set({
					mockProperty1: 'mock value 1',
					mockProperty2: 'mock value 2'
				});
			});

			it('calls the `_setMany` method with the properties', () => {
				assert.calledOnce(instance._setMany);
				assert.calledWith(instance._setMany, {
					mockProperty1: 'mock value 1',
					mockProperty2: 'mock value 2'
				});
			});

			it('does not call the `_setOne` method', () => {
				assert.notCalled(instance._setOne);
			});

			it('returns the set property', () => {
				assert.strictEqual(returnValue, 'set many return');
			});

		});

		describe('._setOne(property, value)', () => {
			let returnValue;

			beforeEach(() => {
				DataStore.isAllowedProperty.resetHistory();
				DataStore.normalizePropertyForStorage.resetHistory();
				DataStore.normalizePropertyForStorage.returns('mockNormalizedProperty1');
				sinon.stub(instance, 'invalidate').throws(new Error('mock error'));
				instance.data = {};
				returnValue = instance._setOne('mockProperty1', 'mock value 1');
			});

			it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
				assert.calledOnce(DataStore.normalizePropertyForStorage);
				assert.calledWith(DataStore.normalizePropertyForStorage, 'mockProperty1');
			});

			it('checks that the property is allowed', () => {
				assert.calledOnce(DataStore.isAllowedProperty);
				assert.calledWith(DataStore.isAllowedProperty, 'mockNormalizedProperty1');
			});

			it('sets the specified property to the given value', () => {
				assert.strictEqual(instance.data.mockNormalizedProperty1, 'mock value 1');
			});

			it('returns the new value', () => {
				assert.strictEqual(returnValue, 'mock value 1');
			});

			describe('when `property` is not allowed', () => {
				let caughtError;

				beforeEach(() => {
					DataStore.isAllowedProperty.resetHistory();
					DataStore.normalizePropertyForStorage.resetHistory();
					instance.data = {};
					DataStore.isAllowedProperty.returns(false);
					try {
						instance._setOne('mockProperty1', 'mock value 1');
					} catch (error) {
						caughtError = error;
					}
				});

				it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
					assert.calledOnce(DataStore.normalizePropertyForStorage);
					assert.calledWith(DataStore.normalizePropertyForStorage, 'mockProperty1');
				});

				it('checks that the property is allowed', () => {
					assert.calledOnce(DataStore.isAllowedProperty);
					assert.calledWith(DataStore.isAllowedProperty, 'mockNormalizedProperty1');
				});

				it('does not set the property', () => {
					assert.isUndefined(instance.data.mockNormalizedProperty1);
				});

				it('throws a validation error', () => {
					assert.calledOnce(instance.invalidate);
					assert.calledWith(instance.invalidate, 'DataStore.mockNormalizedProperty1 is not an allowed property name', {}, 'DISALLOWED_PROPERTY');
					assert.strictEqual(caughtError, instance.invalidate.firstCall.exception);
				});

			});

			describe('when `property` has a corresponding validator function', () => {

				beforeEach(() => {
					DataStore.isAllowedProperty.resetHistory();
					DataStore.normalizePropertyForStorage.resetHistory();
					instance.data = {};
					instance.validateMockProperty1 = sinon.stub().returns('mock validator return');
					returnValue = instance._setOne('mockProperty1', 'mock value 1');
				});

				it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
					assert.calledOnce(DataStore.normalizePropertyForStorage);
					assert.calledWith(DataStore.normalizePropertyForStorage, 'mockProperty1');
				});

				it('checks that the property is allowed', () => {
					assert.calledOnce(DataStore.isAllowedProperty);
					assert.calledWith(DataStore.isAllowedProperty, 'mockNormalizedProperty1');
				});

				it('validates the property value using the validator', () => {
					assert.calledOnce(instance.validateMockProperty1);
					assert.calledWith(instance.validateMockProperty1, 'mock value 1');
				});

				it('sets the specified property to the given value', () => {
					assert.strictEqual(instance.data.mockNormalizedProperty1, 'mock value 1');
				});

				it('returns the new value', () => {
					assert.strictEqual(returnValue, 'mock value 1');
				});

			});

			describe('when `property` has a corresponding validator function that throws', () => {
				let caughtError;
				let validationError;

				beforeEach(() => {
					DataStore.isAllowedProperty.resetHistory();
					DataStore.normalizePropertyForStorage.resetHistory();
					instance.data = {};
					validationError = new Error('mock validation error');
					instance.validateMockProperty1 = sinon.stub().throws(validationError);
					try {
						instance._setOne('mockProperty1', 'mock value 1');
					} catch (error) {
						caughtError = error;
					}
				});

				it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
					assert.calledOnce(DataStore.normalizePropertyForStorage);
					assert.calledWith(DataStore.normalizePropertyForStorage, 'mockProperty1');
				});

				it('checks that the property is allowed', () => {
					assert.calledOnce(DataStore.isAllowedProperty);
					assert.calledWith(DataStore.isAllowedProperty, 'mockNormalizedProperty1');
				});

				it('validates the property value using the validator', () => {
					assert.calledOnce(instance.validateMockProperty1);
					assert.calledWith(instance.validateMockProperty1, 'mock value 1');
				});

				it('does not set the property', () => {
					assert.isUndefined(instance.data.mockNormalizedProperty1);
				});

				it('throws the validation error', () => {
					assert.strictEqual(caughtError, validationError);
				});

			});

			describe('when `property` has a corresponding setter function', () => {

				beforeEach(() => {
					DataStore.isAllowedProperty.resetHistory();
					DataStore.normalizePropertyForStorage.resetHistory();
					instance.data = {};
					instance.setMockProperty1 = sinon.stub().returns('mock setter return');
					returnValue = instance._setOne('mockProperty1', 'mock value 1');
				});

				it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
					assert.calledOnce(DataStore.normalizePropertyForStorage);
					assert.calledWith(DataStore.normalizePropertyForStorage, 'mockProperty1');
				});

				it('checks that the property is allowed', () => {
					assert.calledOnce(DataStore.isAllowedProperty);
					assert.calledWith(DataStore.isAllowedProperty, 'mockNormalizedProperty1');
				});

				it('calls the setter function with the value', () => {
					assert.calledOnce(instance.setMockProperty1);
					assert.calledWith(instance.setMockProperty1, 'mock value 1');
				});

				it('returns the setter return value', () => {
					assert.strictEqual(returnValue, 'mock setter return');
				});

			});

			describe('when `property` has a corresponding setter which is not a function', () => {

				beforeEach(() => {
					DataStore.isAllowedProperty.resetHistory();
					DataStore.normalizePropertyForStorage.resetHistory();
					instance.data = {};
					instance.setMockProperty1 = 'not a function';
					returnValue = instance._setOne('mockProperty1', 'mock value 1');
				});

				it('calls `DataStore.normalizePropertyForStorage` with the property', () => {
					assert.calledOnce(DataStore.normalizePropertyForStorage);
					assert.calledWith(DataStore.normalizePropertyForStorage, 'mockProperty1');
				});

				it('checks that the property is allowed', () => {
					assert.calledOnce(DataStore.isAllowedProperty);
					assert.calledWith(DataStore.isAllowedProperty, 'mockNormalizedProperty1');
				});

				it('sets the specified property to the given value', () => {
					assert.strictEqual(instance.data.mockNormalizedProperty1, 'mock value 1');
				});

				it('returns the new value', () => {
					assert.strictEqual(returnValue, 'mock value 1');
				});

			});

			describe('when `property` is not a string', () => {

				it('throws an error', () => {
					const expectedErrorMessage = 'property name must be a string';
					assert.throws(() => instance._setOne(123, 'mock value 1'), expectedErrorMessage);
					assert.throws(() => instance._setOne([], 'mock value 1'), expectedErrorMessage);
					assert.throws(() => instance._setOne(null, 'mock value 1'), expectedErrorMessage);
				});

			});

		});

		describe('._setMany(properties)', () => {
			let returnValue;

			beforeEach(() => {
				sinon.stub(instance, '_setOne').returns('set one return');
				instance.data = {};
				returnValue = instance._setMany({
					mockProperty1: 'mock value 1',
					mockProperty2: 'mock value 2'
				});
			});

			it('calls the `_setOne` method with each property', () => {
				assert.calledTwice(instance._setOne);
				assert.calledWith(instance._setOne, 'mockProperty1', 'mock value 1');
				assert.calledWith(instance._setOne, 'mockProperty2', 'mock value 2');
			});

			it('returns the set properties', () => {
				assert.deepEqual(returnValue, {
					mockProperty1: 'mock value 1',
					mockProperty2: 'mock value 2'
				});
			});

			describe('when `properties` is not an object', () => {

				it('throws an error', () => {
					const expectedErrorMessage = 'properties must be an object';
					assert.throws(() => instance._setMany(123), expectedErrorMessage);
					assert.throws(() => instance._setMany([]), expectedErrorMessage);
					assert.throws(() => instance._setMany(null), expectedErrorMessage);
				});

			});

			describe('when `_setOne` errors', () => {
				let caughtError;
				let validationError1;
				let validationError2;

				beforeEach(() => {
					validationError1 = new ValidationError('mock error 1');
					validationError2 = new ValidationError('mock error 2');
					instance._setOne.resetHistory();
					instance._setOne.onCall(0).throws(validationError1);
					instance._setOne.onCall(1).throws(validationError2);
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
					assert.isInstanceOf(caughtError, MultipleValidationError);
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
				assert.isInstanceOf(caughtError, ValidationError);
				assert.strictEqual(caughtError.message, 'mock message');
				assert.deepEqual(caughtError.details, {
					mockDetails: true
				});
			});

		});

		describe('.serialize()', () => {
			let returnValue;

			beforeEach(() => {
				sinon.stub(instance, 'get');
				instance.get.onCall(0).returns('mock value 1');
				instance.get.onCall(1).returns('mock value 2');
				sinon.stub(DataStore, 'normalizePropertyForSerialization');
				DataStore.normalizePropertyForSerialization.onCall(0).returns('mockNormalizedProperty1');
				DataStore.normalizePropertyForSerialization.onCall(1).returns('mockNormalizedProperty2');
				instance.data = {
					mockProperty1: 'mock value 1',
					mockProperty2: 'mock value 1'
				};
				returnValue = instance.serialize();
			});

			it('gets each property', () => {
				assert.calledTwice(instance.get);
				assert.calledWith(instance.get, 'mockProperty1');
				assert.calledWith(instance.get, 'mockProperty2');
			});

			it('calls `DataStore.normalizePropertyForSerialization` with each property in `instance.data`', () => {
				assert.calledTwice(DataStore.normalizePropertyForSerialization);
				assert.calledWith(DataStore.normalizePropertyForSerialization, 'mockProperty1');
				assert.calledWith(DataStore.normalizePropertyForSerialization, 'mockProperty2');
			});

			it('returns the serialized data', () => {
				assert.deepEqual(returnValue, {
					mockNormalizedProperty1: 'mock value 1',
					mockNormalizedProperty2: 'mock value 2'
				});
			});

		});

		describe('.toJSON()', () => {
			let returnValue;

			beforeEach(() => {
				sinon.stub(instance, 'serialize').returns('mock serialized data');
				returnValue = instance.toJSON();
			});

			it('serializes the data store', () => {
				assert.calledOnce(instance.serialize);
				assert.calledWithExactly(instance.serialize);
			});

			it('returns the serialized data', () => {
				assert.strictEqual(returnValue, 'mock serialized data');
			});

		});

		describe('when `data` is a DataStore instance', () => {
			let originalInstance;

			beforeEach(() => {
				originalInstance = new DataStore();
				sinon.stub(originalInstance, 'serialize').returns({
					mockProperty1: 'mock value 1',
					mockProperty2: 'mock value 2'
				});
				DataStore.normalizePropertyForStorage.resetHistory();
				DataStore.normalizePropertyForStorage.onCall(0).returns('mockNormalizedProperty1');
				DataStore.normalizePropertyForStorage.onCall(1).returns('mockNormalizedProperty2');
				instance = new DataStore(originalInstance);
			});

			it('gets the serialized data from the original instance', () => {
				assert.calledOnce(originalInstance.serialize);
			});

			it('calls `DataStore.normalizePropertyForStorage` with each property', () => {
				assert.calledTwice(DataStore.normalizePropertyForStorage);
				assert.calledWith(DataStore.normalizePropertyForStorage, 'mockProperty1');
				assert.calledWith(DataStore.normalizePropertyForStorage, 'mockProperty2');
			});

			describe('.data', () => {

				it('is an object', () => {
					assert.strictEqual(typeof instance.data, 'object');
					assert.isNotNull(instance.data);
				});

				it('is made up of normalised properties and values equal to the original instance data', () => {
					assert.deepEqual(instance.data, {
						mockNormalizedProperty1: 'mock value 1',
						mockNormalizedProperty2: 'mock value 2'
					});
				});

			});

		});

		describe('when `data` is not an object', () => {

			it('throws an error', () => {
				assert.throws(() => new DataStore('nope'), 'DataStore data must be an object');
			});

		});

		describe('when `data` is an array', () => {

			it('throws an error', () => {
				assert.throws(() => new DataStore([]), 'DataStore data must be an object');
			});

		});

		describe('when `data` is `null`', () => {

			it('throws an error', () => {
				assert.throws(() => new DataStore(null), 'DataStore data must be an object');
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
			assert.isInstanceOf(returnValue, DataStore);
			assert.deepEqual(returnValue.data, data);
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
				assert.isInstanceOf(returnValue, Array);
				assert.isInstanceOf(returnValue[0], DataStore);
				assert.deepEqual(returnValue[0].data, data[0]);
				assert.isInstanceOf(returnValue[1], DataStore);
				assert.deepEqual(returnValue[1].data, data[1]);
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
			sinon.stub(instance, 'serialize').returns('mock serialize 1');
			returnValue = DataStore.serialize(instance);
		});

		it('serializes the DataStore instance', () => {
			assert.calledOnce(instance.serialize);
			assert.calledWithExactly(instance.serialize);
		});

		it('returns the serialized data', () => {
			assert.strictEqual(returnValue, 'mock serialize 1');
		});

		describe('when `dataStore` is an array of DataStore instances', () => {
			let instance1;
			let instance2;

			beforeEach(() => {
				instance1 = new DataStore();
				sinon.stub(instance1, 'serialize').returns('mock serialize 1');
				instance2 = new DataStore();
				sinon.stub(instance2, 'serialize').returns('mock serialize 2');
				returnValue = DataStore.serialize([
					instance1,
					instance2
				]);
			});

			it('serializes each DataStore instance', () => {
				assert.calledOnce(instance1.serialize);
				assert.calledWithExactly(instance1.serialize);
				assert.calledOnce(instance2.serialize);
				assert.calledWithExactly(instance2.serialize);
			});

			it('returns an array of serialized data', () => {
				assert.isInstanceOf(returnValue, Array);
				assert.strictEqual(returnValue[0], 'mock serialize 1');
				assert.strictEqual(returnValue[1], 'mock serialize 2');
			});

		});

		describe('when `dataStore` is not an instance of DataStore or an array', () => {

			it('throws an error', () => {
				const expectedErrorMessage = 'dataStore argument must be an instance of DataStore';
				assert.throws(() => DataStore.serialize(123), expectedErrorMessage);
				assert.throws(() => DataStore.serialize({}), expectedErrorMessage);
				assert.throws(() => DataStore.serialize(null), expectedErrorMessage);
			});

		});

		describe('when `dataStore` is an array which contains items which are not DataStore instances', () => {

			it('throws an error', () => {
				const expectedErrorMessage = 'dataStore argument must be an instance of DataStore';
				assert.throws(() => DataStore.serialize([123]), expectedErrorMessage);
				assert.throws(() => DataStore.serialize([{}]), expectedErrorMessage);
				assert.throws(() => DataStore.serialize([null]), expectedErrorMessage);
			});

		});

	});

	describe('.normalizePropertyForSerialization(property)', () => {
		let returnValue;

		beforeEach(() => {
			returnValue = DataStore.normalizePropertyForSerialization('mock-property-1');
		});

		it('returns the property as-is', () => {
			assert.strictEqual(returnValue, 'mock-property-1');
		});

	});

	describe('.normalizePropertyForStorage(property)', () => {
		let returnValue;

		beforeEach(() => {
			returnValue = DataStore.normalizePropertyForStorage('mock-property-1');
		});

		it('converts `property` to camelBack case', () => {
			assert.calledOnce(varname.camelback);
			assert.calledWith(varname.camelback, 'mock-property-1');
		});

		it('returns the converted property', () => {
			assert.strictEqual(returnValue, varname.camelback.firstCall.returnValue);
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
			assert.strictEqual(returnValue, true);
		});

		describe('when the DataStore has an `allowedProperties` array which includes the property', () => {

			beforeEach(() => {
				DataStore.allowedProperties = ['mockProperty1'];
				returnValue = DataStore.isAllowedProperty('mockProperty1');
			});

			it('returns `true`', () => {
				assert.strictEqual(returnValue, true);
			});

		});

		describe('when the DataStore has an `allowedProperties` array which does not include the property', () => {

			beforeEach(() => {
				DataStore.allowedProperties = ['mockProperty2'];
				returnValue = DataStore.isAllowedProperty('mockProperty1');
			});

			it('returns `false`', () => {
				assert.strictEqual(returnValue, false);
			});

		});

		describe('when the DataStore has a `disallowedProperties` array which does not include the property', () => {

			beforeEach(() => {
				DataStore.disallowedProperties = ['mockProperty2'];
				returnValue = DataStore.isAllowedProperty('mockProperty1');
			});

			it('returns `true`', () => {
				assert.strictEqual(returnValue, true);
			});

		});

		describe('when the DataStore has a `disallowedProperties` array which does include the property', () => {

			beforeEach(() => {
				DataStore.disallowedProperties = ['mockProperty1'];
				returnValue = DataStore.isAllowedProperty('mockProperty1');
			});

			it('returns `false`', () => {
				assert.strictEqual(returnValue, false);
			});

		});

	});

	describe('.MultipleValidationError', () => {

		it('aliases `lib/validation-error`', () => {
			assert.strictEqual(DataStore.MultipleValidationError, MultipleValidationError);
		});

	});

	describe('.ValidationError', () => {

		it('aliases `lib/validation-error`', () => {
			assert.strictEqual(DataStore.ValidationError, ValidationError);
		});

	});

});
