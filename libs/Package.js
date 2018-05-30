import {basename, dirname} from 'path';

import Module from './Module';

import {merge} from './utility';

const Array_iterator = [ ][Symbol.iterator], Array_proto = Array.prototype;

var depth = 0;


/**
 * Package to be bundled
 */
export default  class Package {
    /**
     * @param {string}  path               - The entry file path of this package
     *                                       (relative to `process.cwd()`)
     * @param {boolean} [includeAll=false] - Include NPM modules in the final bundle
     * @param {?Map}    [moduleMap]        - Map to replace some dependencies to others
     * @param {boolean} [noLog=false]      - Disable log output
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
         * Key for original name of a module & value for module name of the replacement
         *
         * @type {Object}
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

        const index = this.indexOf( modName );

        if (index < 0) {

            Array_proto.unshift.call(
                this,
                new Module(modName, this.base, this.includeAll, this.moduleMap)
            );

            return  this[0].countUp( depth );
        } else
            this[ index ].countUp( depth );
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

        depth++;

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

        for (let path of module.dependencyPath)  this.parse( path );

        depth--;
    }

    /**
     * @protected
     *
     * @return {Package} This package sorted by module dependency
     */
    sort() {

        return  Array_proto.sort.call(this,  (A, B) => {

            const A_D = A.dependencyPath, B_D = B.dependencyPath;

            if (B_D.includes( A.name ))  return -1;

            if (A_D.includes( B.name ))  return 1;

            return  (B.depth - A.depth)  ||
                (A_D.length - B_D.length)  ||  (B.referCount - A.referCount);
        });
    }

    /**
     * Outside dependencies of this package
     *
     * @type {DependencyMap}
     */
    get outDependency() {

        return  this.includeAll  ?  [ ]  :  Object.assign(
            ... Array.from(this,  module => module.dependency.outside)
        );
    }

    /**
     * @protected
     *
     * @param {string}                                                 name    - Module name of bundled package
     * @param {function(modName: string[], varName: string[]): string} bundler
     *
     * @return {string} Bundled source with UMD wrapper
     */
    wrap(name, bundler) {

        const outside = this.outDependency;

        const modName = Object.keys( outside ), varName = Object.values( outside );

        const dependency = modName[0]  ?  `${JSON.stringify( modName )}, `  :  '';

        return `
//
//  Generated by https://www.npmjs.com/package/amd-bundle
//
(function (factory) {

    if ((typeof define === 'function')  &&  define.amd)
        define('${name}', ${dependency}factory);
    else if (typeof module === 'object')
        return  module.exports = factory(${modName.map(name => `require('${name}')`)});
    else
        return  this.${name} = factory(${modName.map(name => `this.${name}`)});

})(${bundler(modName, varName)});`.trim();
    }

    /**
     * @param {string} [name] - Module name of bundled package
     *                          (Default: The entry module's name)
     * @return {string} Source code of this package
     */
    bundle(name) {

        const entry = basename( this.path );

        this.parse(`./${entry}`);

        return this.sort().wrap(
            name || entry,
            (modName, varName) => `function (${varName}) {

    var module = {
        ${Array.from(
        this,  item => `'${item.name}':  {exports: { }}`
    ).concat(
        modName.map((name, index)  =>  `'${name}':  {exports: ${varName[index]}}`)
    ).join(',\n        ')}
    };

${merge}

    function _require_(base, path) {

        return module[
            /^\\w/.test( path )  ?  path  :  ('./' + merge(base, path))
        ].exports;
    }

    var require = _require_.bind(null, './');

${Array.from(this,  item => item.source).join('\n\n')}

    ${Array.from(this,  item => `module['${item.name}'].exports = ${item.identifier}(${

        Object.keys( item.dependency.compile ).map(
            child => `require('${child}')`
        ).concat(
            `_require_.bind(null, '${item.base}')`,
            `require('${item.name}')`,
            `module['${item.name}']`
        ).join(', ')

    }) || require('${item.name}');`).join('\n\n    ')}

    return require('${this.entry.name}');
}`);
    }
}
