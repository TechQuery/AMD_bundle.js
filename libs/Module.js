import {dirname, join} from 'path';

import * as Utility from './utility';


const AMD_CJS = ['require', 'exports', 'module'];

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
     * @param {string}  name       - Path of this module
     * @param {string}  path       - Root path of the package which this module belongs to
     * @param {boolean} includeAll - Treat NPM modules as CommonJS modules
     */
    constructor(name, path, includeAll) {
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
    get identifier() {  return  this.name.replace(/[./]+/g, '_');  }

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

        for (let method  of  ['getNPMFile', 'getNPMPackage', 'getNPMIndex']) {

            let path;

            if (path = Utility[method]( this.name ))  return path;
        }
    }

    /**
     * @protected
     *
     * @return {string} Original source code of this module
     */
    async load() {

        this.source = await Utility.loadFile(
            ((! this.dependency.outside)  &&  /^\w/.test( this.name ))  ?
                this.searchNPM()  :  join(this.path, `${this.name}.js`)
        );

        return  this.source = (this.source + '').replace(/\r\n/g, '\n');
    }

    /**
     * Add a depended module of this module
     *
     * @protected
     *
     * @param {string} type    - `compile` for AMD & `runtime` for CJS
     * @param {string} name    - Name of a module
     * @param {string} varName - Variable name of a module in another module
     */
    addChild(type, name, varName) {

        if ((type === 'compile')  &&  AMD_CJS.includes( name ))  return;

        const NPM = /^\w/.test( name );

        if (this.dependency.outside && NPM)  type = 'outside';

        name = (NPM ? '' : './')  +  join(this.base, name).replace(/\\/g, '/');

        this.dependency[ type ][ name ] = varName;
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

                modName.replace(
                    /(?:'|")(.+?)(?:'|")/g,
                    (_, name)  =>
                        this.addChild('compile',  name,  varName[ index ])  ||  index++
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
