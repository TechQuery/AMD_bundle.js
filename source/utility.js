import {transform} from 'babel-core';

import {join} from 'path';

import {existsSync, readFileSync, statSync} from 'fs';


/**
 * @param {string} raw - RegExp literal string
 *
 * @return {?RegExp}
 */
export function toRegExp(raw) {

    const match = raw.match( /^\/(.+)\/([a-z]+)?$/ );

    if ( match )  return  new RegExp(match[1], match[2]);
}


/**
 * @param {string}  code         - ES 6+ source code
 * @param {boolean} [onlyModule] - Only transform ES 6 module to CommonJS
 *
 * @return {string} ES 5 source code
 */
export function toES_5(code, onlyModule) {

    const option = {
        plugins:  ['transform-es2015-modules-commonjs'],
        ast:      false,
        babelrc:  false
    };

    if (! onlyModule)  option.presets = ['env'];

    return  transform(code, option).code.replace(
        /^(?:'|")use strict(?:'|");\n+/,  ''
    );
}


/**
 * This will be used in the bundled source
 *
 * @param {string} base - Root path
 * @param {string} path - Path relative to `base`
 *
 * @return {string} Joined & normalized path
 */
export function merge(base, path) {

    return  (base + '/' + path)
        .replace(/\/\//g, '/')
        .replace(/[^/.]+\/\.\.\//g, '')
        .replace(/\.\//g,  function (match, index, input) {

            return  (input[index - 1]  ===  '.')  ?  match  :  '';
        });
}


function inNPM(path) {

    if (existsSync(path = join('node_modules', path)))
        return  path.replace(/\\/g, '/');
}


function findNPMFile(list) {

    for (let path of list)  if (path = inNPM( path ))  return path;
}


/**
 * @param {string} name - Name of a module
 *
 * @return {?string} Valid `name` in `./node_modules/` is a JS or JSON file
 */
export function getNPMFile(name) {

    return  findNPMFile([name, `${name}.js`, `${name}.json`]);
}


/**
 * @param {string} name - Name of a module
 *
 * @return {?string} Valid `name` in `./node_modules/` is `index.js` or `index.json`
 */
export function getNPMIndex(name) {

    return  findNPMFile([`${name}/index.js`, `${name}/index.json`]);
}


/**
 * @param {string} name - Name of a module
 *
 * @return {?string} Entry file path of an existing `package.json`
 */
export function getNPMPackage(name) {

    var path = inNPM(`${name}/package.json`);

    if (! path)  return;

    const config = JSON.parse( readFileSync( path ) );

    for (let key  of  ['main', 'browser'])
        if (path = inNPM( join(name, config[key]) ))
            return  statSync( path ).isFile()  ?  path  :  getNPMIndex( path );
}
