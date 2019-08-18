'use strict';

const sinon = require('sinon');

const varname = require('varname');

sinon.spy(varname, 'camelback');
sinon.spy(varname, 'camelcase');
sinon.spy(varname, 'dash');
sinon.spy(varname, 'underscore');

module.exports = varname;
