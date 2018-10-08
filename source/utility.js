import {join} from 'path';

import {existsSync, readFileSync, statSync} from 'fs';

import { minify } from 'uglify-js';


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


/**
 * @param {string} name - Name of a module
 *
 * @return {boolean} Whether `name` is a dependency out of this package
 */
export function outPackage(name) {  return /^[^./]/.test( name );  }



function fileInNPM(path) {

    path = join('node_modules', path);

    if (existsSync( path )  &&  statSync( path ).isFile())
        return  path.replace(/\\/g, '/');
}


function findNPMFile(list) {

    for (let path of list)  if (path = fileInNPM( path ))  return path;
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

    var path = fileInNPM(`${name}/package.json`);

    if (! path)  return;

    const config = JSON.parse( readFileSync( path ) );

    for (let key  of  ['main', 'browser'])
        if (path = fileInNPM( join(name, config[key]) ))
            return  statSync( path ).isFile()  ?  path  :  getNPMIndex( path );
}


/**
 * @param {String} source   - JS source code
 * @param {String} filename - Name of this JS source file
 *
 * @return   {Object}
 * @property {String} code
 * @property {String} map
 */
export function uglify(source, filename) {

    const {error, code, map} = minify(source, {
        mangle:     {
            keep_fnames:    true
        },
        output:     {
            comments:    'some'
        },
        ie8:        true,
        sourceMap:  {
            filename,  url: `${filename}.map`
        },
        warnings:   'verbose'
    });

    if ( error )  throw error;

    return  {code, map};
}
