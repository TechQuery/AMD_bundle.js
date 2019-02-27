import {EventEmitter} from 'events';

import {dirname, join} from 'path';

import {readFileSync} from 'fs';

import * as Utility from './utility';

import { toES_5 } from '@tech_query/node-toolkit';


const AMD_CJS = ['require', 'exports', 'module'];

/**
 * Key for the replacement of a module name, and value for a {@link RegExp}
 *
 * @typedef {Object} NameMap
 */

/**
 * Key for module path & value for local variable
 *
 * @typedef {Object} DependencyMap
 */


/**
 * CommonJS or AMD module
 */
export default  class Module extends EventEmitter {
    /**
     * @param {string}  name               - Path of this module
     * @param {string}  [path='.']         - Root path of the package which this module belongs to
     * @param {boolean} [includeAll=false] - Treat NPM modules as CommonJS modules
     * @param {NameMap} [nameMap]          - Map to replace some dependencies to others
     */
    constructor(name,  path = '.',  includeAll = false,  nameMap) {
        /**
         * Path of this module
         *
         * @type {string}
         */
        super().name = name.replace(/\\/g, '/');

        /**
         * Directory path of this module
         *
         * @type {string}
         */
        this.base = dirname( this.name );

        /**
         * Full name of this module file
         *
         * @type {string}
         */
        this.fileName = join(path, `${this.name}.js`);

        /**
         * @type     {Object}
         * @property {DependencyMap} compile - Compile-time dependency from AMD
         * @property {DependencyMap} runtime - Runtime dependency from CommonJS
         * @property {DependencyMap} outside - Outside dependency from NPM
         */
        this.dependency = {
            compile:  { },
            runtime:  { },
            outside:  includeAll ? null : { }
        };

        /**
         * CLI engine (Hash bang)
         *
         * @type {String}
         */
        this.CLI = '';

        /**
         * @type {NameMap}
         */
        this.nameMap = nameMap  ||  { };
    }

    /**
     * @param {string} name - Name of a module
     *
     * @return {string}
     */
    static identifierOf(name) {  return  name.replace(/\W+/g, '_');  }

    /**
     * Identifier of this module in JS code
     *
     * @type {string}
     */
    get identifier() {  return  Module.identifierOf( this.name );  }

    /**
     * Paths of all the dependency needed to be bundled
     *
     * @type {string[]}
     */
    get dependencyPath() {

        return  Object.keys( this.dependency.compile ).concat(
            Object.keys( this.dependency.runtime )
        );
    }

    /**
     * @protected
     *
     * @return {?string} Entry file path of this module in `./node_modules/`
     */
    searchNPM() {

        const list = ['getNPMFile', 'getNPMPackage', 'getNPMIndex'];

        while ( list[0] ) {

            let path = Utility[ list.shift() ]( this.name );

            if ( path )  return path;
        }
    }

    /**
     * @protected
     *
     * @return {string} Original source code of this module
     */
    load() {

        this.source = readFileSync(
            ((! this.dependency.outside)  &&  Utility.outPackage( this.name ))  ?
                this.searchNPM() : this.fileName
        ) + '';

        this.source = this.source.replace(
            /^#!.+[\r\n]+/,  engine => (this.CLI = engine.trim()) && ''
        );

        if (/^(import|export) /m.test( this.source ))
            this.source = toES_5(this.source, this.fileName, true);

        return  this.source = this.source.replace(/\r\n/g, '\n');
    }

    /**
     * @param {string} module - Module name from source code
     *
     * @emits {ReplaceEvent}
     *
     * @return {?string} New module name if `module` is matched in the name map
     */
    mapName(module) {

        for (let name in this.nameMap) {

            let result = module.replace(this.nameMap[ name ],  name);

            if (result !== module) {

                this.emit('replace', module, result);  return result;
            }
        }
    }

    /**
     * Add a depended module of this module
     *
     * @protected
     *
     * @param {string} type      - `compile` for AMD & `runtime` for CJS
     * @param {string} name      - Name of a module
     * @param {string} [varName] - Variable name of a module in another module
     *
     * @return {?String} Replaced module name
     */
    addChild(type, name, varName) {

        if ((type === 'compile')  &&  AMD_CJS.includes( name ))  return;

        name = Utility.outPackage( name )  ?  name  :  (
            './'  +  join(this.base, name).replace(/\\/g, '/')
        );

        const newName = this.mapName( name );  name = newName || name;

        if (this.dependency.outside  &&  (name[0] !== '.'))  type = 'outside';

        this.dependency[ type ][ name ] = varName  ||  Module.identifierOf( name );

        return newName;
    }

    /**
     * @protected
     *
     * @return {DependencyMap} Compile-time dependency
     */
    parseAMD() {

        this.source = this.source.replace(
            /define\((?:\s*\[([\s\S]*?)\]\s*,)?\s*function\s*\(([\s\S]*?)\)\s*\{([\s\S]+)\}\s*\);?/,
            (_, modName, varName, body) => {

                var index = 0;  varName = varName.trim().split( /\s*,\s*/ );

                (modName || '').replace(
                    /(?:'|")(.+?)(?:'|")/g,
                    (_, name)  =>  (
                        this.addChild('compile', name, varName[index]),  index++
                    )
                );

                return  body.replace(/^\n([\s\S]+)\n$/, '$1');
            }
        );

        return this.dependency.compile;
    }

    /**
     * @protected
     *
     * @return {DependencyMap} Runtime dependency
     */
    parseCJS() {

        this.source = this.source.replace(
            /((?:var|let|const)\s+\w+?\s*=.*?)?require\(\s*(?:'|")(.+?)(?:'|")\s*\)/mg,
            (_, assign, modName)  =>
                `${assign || ''}require('${
                    this.addChild('runtime', modName)  ||  modName
                }')`
        );

        return this.dependency.runtime;
    }

    /**
     * @return {string} Factory code of this parsed module
     */
    parse() {

        this.load();

        this.parseAMD();

        this.parseCJS();

        return  this.source = `function (${

            Object.values( this.dependency.compile ).concat( AMD_CJS ).join(', ')
        }) {${
            this.source
        }}`;
    }

    /**
     * @return {string} Factory code of this parsed module
     */
    toString() {

        return  ('source' in this)  ?  (this.source + '')  :  '';
    }
}
