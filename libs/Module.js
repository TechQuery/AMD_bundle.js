import {dirname, join} from 'path';

import {readFile} from 'fs';

import {promisify} from 'util';

const loadFile = promisify( readFile ), AMD_CJS = ['require', 'exports', 'module'];


/**
 * Key for module path & value for local variable
 *
 * @typedef {Object} DependencyMap
 */


/**
 * CommonJS or AMD module
 */
export default  class Module {
    /**
     * @param {string} name - Path of this module
     * @param {string} path - Root path of the package which this module belongs to
     */
    constructor(name, path) {
        /**
         * Path of this module
         *
         * @type {string}
         */
        this.name = name;

        /**
         * Directory path of this module
         *
         * @type {string}
         */
        this.base = dirname( name ).replace(/\\/g, '/');

        /**
         * Root path of the package which this module belongs to
         *
         * @type {string}
         */
        this.path = path;

        /**
         * @type     {Object}
         * @property {DependencyMap} compile - Compile-time dependency
         * @property {DependencyMap} runtime - Runtime dependency
         */
        this.dependency = {
            compile:  { },
            runtime:  { }
        };

        /**
         * Modules which this module depends
         *
         * @type {Module[]}
         */
        this.children = [ ];
    }

    /**
     * Identifier of this module in JS code
     *
     * @type {string}
     */
    get identifier() {

        return  this.name.replace(/[./]+/g, '_').replace(/^_/, '');
    }

    /**
     * Paths of all the dependency
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
     * @return {string} Original source code of this module
     */
    async load() {

        return  this.source = (await loadFile(
            join(this.path, `${this.name}.js`),  {encoding: 'utf-8'}
        )).replace(/\r\n/g, '\n');
    }

    addChild(type, name, varName) {

        this.dependency[ type ][ join(this.base, name).replace(/\\/g, '/') ] = varName;
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

                modName.replace(/(?:'|")(.+?)(?:'|")/g,  (_, name) => {

                    if (! AMD_CJS.includes( name ))
                        this.addChild('compile',  name,  varName[ index ]);

                    index++;
                });

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

        this.source.replace(
            /(?:(?:var|let|const)\s+(.+?)\s*=\s*)?require\(\s*(?:'|")(.+?)(?:'|")\s*\)/mg,
            (match, varName, modName)  =>
                this.addChild('runtime', modName, varName)  ||  match
        );

        return this.dependency.runtime;
    }

    /**
     * @return {string} Factory code of this parsed module
     */
    async parse() {

        await this.load();

        this.parseAMD();

        this.parseCJS();

        return  this.source = `function ${this.identifier}(${

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
