import {basename, dirname} from 'path';

import Module from './Module';

import {generate} from './UMD';

const Array_iterator = [ ][Symbol.iterator], { unshift } = Array.prototype;


/**
 * Package to be bundled
 */
export default  class Package {
    /**
     * @param {string}   path               - The entry file path of this package
     *                                       (relative to `process.cwd()`)
     * @param {boolean}  [includeAll=false] - Include NPM modules in the final bundle
     * @param {?NameMap} moduleMap          - Map to replace some dependencies to others
     * @param {boolean}  [noLog=false]      - Disable log output
     */
    constructor(path,  includeAll = false,  moduleMap,  noLog = false) {
        /**
         * The entry file path of this package
         *
         * @type {string}
         */
        this.path = path;

        /**
         * The root path of this package (relative to `process.cwd()`)
         *
         * @type {string}
         */
        this.base = dirname( path );

        /**
         * Whether include NPM modules in the final bundle
         *
         * @type {boolean}
         */
        this.includeAll = includeAll;

        /**
         * Module count of this package
         *
         * @type {number}
         */
        this.length = 0;

        /**
         * @type {NameMap}
         */
        this.moduleMap = moduleMap;

        /**
         * Whether show logs during the bundle process
         *
         * @type {boolean}
         */
        this.showLog = (! noLog);
    }

    [Symbol.iterator]() {  return  Array_iterator.call( this );  }

    /**
     * @param {Module|string} module - Instance or name of a module
     *
     * @return {number}
     */
    indexOf(module) {

        for (let i = 0;  this[i];  i++)
            if (
                (module instanceof Module)  ?
                    (module === this[i])  :  (module === this[i].name)
            )
                return i;

        return -1;
    }

    /**
     * @protected
     *
     * @param {string} modName - Path of a module
     *
     * @return {?Module} New module
     */
    register(modName) {

        if (this.indexOf( modName )  >  -1)  return;

        unshift.call(
            this,
            new Module(modName, this.base, this.includeAll, this.moduleMap)
        );

        return this[0];
    }

    /**
     * Entry module of this package
     *
     * @type {Module}
     */
    get entry() {  return  this[this.length - 1];  }

    /**
     * @protected
     *
     * @param {string} modName - Path of a module
     */
    parse(modName) {

        const module = this.register( modName );

        if (! module)  return;

        if ( this.showLog )
            module.on('replace',  (oldMod, newMod)  =>
                console.info(
                    `→ Module "${oldMod}" will be replaced by "${newMod}"`
                )
            );

        module.parse();

        if ( this.showLog )
            console.info(`√ Module "${modName}" has been bundled`);

        module.dependencyPath.forEach( this.parse.bind( this ) );
    }

    /**
     * Outside dependencies of this package
     *
     * @type {DependencyMap}
     */
    get outDependency() {

        return  this.includeAll  ?  [ ]  :  Object.assign.apply(
            Object,  Array.from(this,  module => module.dependency.outside)
        );
    }

    /**
     * @param {string} [name] - Module name of bundled package
     *                          (Default: The entry module's name)
     * @return {string} Source code of this package
     */
    bundle(name) {

        const entry = basename( this.path );

        this.parse(`./${entry}`);

        return generate(
            this,  name || entry,  this.entry.name,  this.outDependency
        );
    }
}
