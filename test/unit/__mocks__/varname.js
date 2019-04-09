'use strict';

const varname = jest.requireActual('varname');

jest.spyOn(varname, 'camelback');
jest.spyOn(varname, 'camelcase');
jest.spyOn(varname, 'dash');
jest.spyOn(varname, 'underscore');

module.exports = varname;
