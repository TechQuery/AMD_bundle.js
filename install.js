#! /usr/bin/env node

const FS = require('fs-extra');


FS.ensureDirSync('build/');

FS.outputFileSync('node_modules/test.js',  'exports.test = 1;');
