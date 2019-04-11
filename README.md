
# @rowanmanning/data-store

Represent your data with model-like objects.

**:warning: This is pre-release software, use in production at your own risk**


## Table of Contents

  * [Requirements](#requirements)
  * [Usage](#usage)
    * [Creating a data store](#creating-a-data-store)
    * [Getting properties](#getting-properties)
    * [Setting properties](#setting-properties)
    * [Serializing the data store](#serializing-the-data-store)
    * [Extending a data store](#extending-a-data-store)
      * [Getters](#getters)
      * [Setters](#setters)
      * [Validators](#validators)
      * [Property normalisation](#property-normalisation)
      * [Serialized property normalization](#serialized-property-normalization)
      * [Allowed properties](#allowed-properties)
  * [Contributing](#contributing)
  * [License](#license)


## Requirements

This library requires the following to run:

  * [Node.js](https://nodejs.org/) 10+


## Usage

Install with [npm](https://www.npmjs.com/):

```sh
npm install @rowanmanning/data-store
```

Load the library into your code with a `require` call:

```js
const DataStore = require('@rowanmanning/data-store');
```

### Creating a data store

```js
const banana = new DataStore({
    color: 'yellow',
    shape: 'curved',
    scientificName: 'Musa'
});
```

### Getting properties

Use the `get` method to get values from the store:

```js
banana.get('color'); // 'yellow'
banana.get('shape'); // 'curved'
```

Property names are [normalised](#property-normalisation), so the following will all return the same data:

```js
banana.get('scientificName');  // 'Musa'
banana.get('scientific_name'); // 'Musa'
banana.get('ScientificName');  // 'Musa'
banana.get('scientific-name'); // 'Musa'
```

If a [getter](#getters) is defined on the `DataStore` or an extending class, it will be run during the fetching of the matching property. Getters follow the pattern `get<PropertyName>`:

```js
banana.getScientificName = () => {
    return `👩‍🔬🌱 ${this.data.scientificName}`;
};

banana.get('scientificName'); // '👩‍🔬🌱 Musa'
```

### Setting properties

Use the `set` method to set values in the store:

```js
banana.set('color', 'green');
banana.set('shape', 'straight');
```

or

```js
banana.set({
    color: 'green',
    shape: 'straight'
});
```

Property names are also [normalised](#property-normalisation) in setting, so the following will all set the same property (`scientificName`):

```js
banana.set('scientificName', 'Musa');
banana.set('scientific_name', 'Musa');
banana.set('ScientificName', 'Musa');
banana.set('scientific-name', 'Musa');
```

If a [setter](#setters) is defined on the `DataStore` or an extending class, it will be run during the setting of the matching property. Setters follow the pattern `set<PropertyName>`:

```js
banana.setColor = (value) => {
    return this.data.color = value.trim().toLowerCase();
};

banana.set('color', '  GREEN  ');
```

### Serializing the data store

You can get the data store represented as a simple object with key/value pairs like this:

```js
banana.serialize(); // { color: 'yellow', shape: 'curved', ... }
```

### Extending a data store

Data stores are more useful when they're extended to suit the shape of your data. You can specify property getters and setters as well as customise the way property names are normalised.

```js
class Fruit extends DataStore {

    setColor(value) {
        if (!['red', 'green', 'blue', 'yellow'].includes(color)) {
            throw new Error('Invalid color');
        }
        return this.data.color = value;
    }

}

const banana = new Fruit({
    color: 'yellow',
    shape: 'curved'
});
```

#### Getters

Getters defined on an extended `DataStore` must be named in the format `get<PropertyName>`, where the property name is camel-case.

Getters receive no arguments, and must return the requested value or throw an error. A getter can use the `get` method to access existing properties or the `data` property on the instance.

Getters _can_ be async functions, but none of the resolution logic caters for async functions. This means that calling `.get` with a property that has an async getter will always return a `Promise`.

```js
class Fruit extends DataStore {

    // Using the `data` property
    getColor() {
        return this.data.color;
    }

    // Using the `get` method to create a "virtual" property
    getUpperCaseColor() {
        return this.get('color').toUpperCase();
    }

    // This is BAD and will result in an infinite loop
    getShape() {
        return this.get('shape');
    }

}
```

When using the `data` property, you bypass the property normalisation process. You can ensure that you're always getting the correct property name by using the `.normalizePropertyForStorage` static method:

```js
class Fruit extends DataStore {

    getScientificName() {
        const normalizedName = Fruit.normalizePropertyForStorage('scientific-name');
        return this.data[normalizedName];
    }

}
```

#### Setters

Setters defined on an extended `DataStore` must be named in the format `set<PropertyName>`, where the property name is camel-case.

Setters receive one argument: the value that the property should be set to. They must return the set value or throw an error. A setter can use the `set` method to access existing properties or the `data` property on the instance.

Setters _can_ be async functions, but none of the resolution logic caters for async functions. This means that calling `.set` with a property that has an async setter will not necessarily store the data immediately. This could result in race conditions.

```js
class Fruit extends DataStore {

    // Using the `data` property
    setColor(value) {
        return this.data.color = value;
    }

    // Using the `set` method to create a "virtual" setter
    setUpperCaseColor(value) {
        return this.set('color', value.toLowerCase());
    }

    // This is BAD and will result in an infinite loop
    setShape(value) {
        return this.set('shape', value);
    }

}
```

When using the `data` property, you bypass the property normalisation process. You can ensure that you're always setting the correct property name by using the `.normalizePropertyForStorage` static method:

```js
class Fruit extends DataStore {

    setScientificName(value) {
        const normalizedName = Fruit.normalizePropertyForStorage('scientific-name');
        return this.data[normalizedName] = value;
    }

}
```

#### Validators

Validators defined on an extended `DataStore` must be named in the format `validate<PropertyName>`, where the property name is camel-case.

Validators receive one argument: the value that the property is being set to. They must either return nothing or throw an error (ideally either `DataStore.ValidationError`, or using the built-in `invalidate` method).

Validators _cannot_ be async functions – they will not function correctly if they are defined as asynchronous.

```js
class Fruit extends DataStore {

    validateColor(value) {
        if (!['red', 'green', 'blue', 'yellow'].includes(color)) {
            throw new DataStore.ValidationError('Invalid color');
        }
    }

}

// Throws because color is invalid
const banana = new Fruit({
    color: 'yellowy-green'
});
```

The built-in `invalidate` method is a shortcut for creating validation errors. Validation errors have an optional second argument named `details`, which can be used to attach extra information to an error.

```js
class Fruit extends DataStore {

    validateColor(value) {
        const validColors = ['red', 'green', 'blue', 'yellow'];
        if (!validColors.includes(color)) {
            this.invalidate('Invalid color', {
                given: value,
                expected: validColors
            });
        }
    }

}
```

#### Property normalisation

Property names are normalised when they're set on a `DataStore` instance, including during construction. The default normalization is to convert property names to camel-back case. E.g. `scientific_name` becomes `scientificName`.

This can be overridden in extending classes by reimplementing the `normalizePropertyForStorage` static method:

```js
class Fruit extends DataStore {

    static normalizePropertyForStorage(property) {
        return property.toUpperCase();
    }

}

const banana = new Fruit({
    color: 'yellow'
});

banana.data.COLOR === 'yellow'; // true
```

#### Serialized property normalization

Property names can also be normalised when a `DataStore` instance is serialized. By default they are left in the same format as they are stored under (camel-back case by default).

You may wish to override this behaviour during serialization, e.g. for complying with database field names. This can be overridden in extending classes by reimplementing the `normalizePropertyForSerialization` static method:

```js
const varname = require('varname'); // Or another library that changes variable names

class Fruit extends DataStore {

    static normalizePropertyForSerialization(property) {
        return varname.underscore(property);
    }

}

const banana = new Fruit({
    scientificName: 'yellow'
});

banana.serialize(); // { scientific_name: 'yellow' }
```

#### Allowed properties

The properties that are allowed to be set on a data store can be limited by specifying static properties on an extending class. The properties are `allowedProperties` and `disallowedProperties`, and they must be set to an array.

These allow/disallow lists are checked internally by the `set` method, and only [normalised properties](#property-normalisation) should be added to the list as properties are checked post-normalisation.

```js
class Fruit extends DataStore {}

Fruit.allowedProperties = [
    'color',
    'shape'
];

// Throws because `requiresPeeling` is not an allowed property
const banana = new Fruit({
    color: 'yellow',
    requiresPeeling: true
});
```

```js
class Fruit extends DataStore {}

Fruit.disallowedProperties = [
    'shape'
];

// Throws because `shape` is a disallowed property
const banana = new Fruit({
    color: 'yellow',
    shape: 'curved'
});
```


## Contributing

To contribute to this library, clone this repo locally and commit your code on a separate branch. Please write unit tests for your code, and run the linter before opening a pull-request:

```sh
make test    # run all tests
make verify  # run all linters
```


## License

Licensed under the [MIT](LICENSE) license.<br/>
Copyright &copy; 2019, Rowan Manning
