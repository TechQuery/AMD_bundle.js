import {basename, dirname} from 'path';

import Module from './Module';

import {merge} from './utility';


/**
 * Package to be bundled
 */
export default  class Package {
    /**
     * @param {string}  path       - The entry file path of this package
     *                               (relative to `process.cwd()`)
     * @param {boolean} includeAll - Include NPM modules in the final bundle
     */
    constructor(path, includeAll) {
        /**
         * The entry file path of this package (relative to `process.cwd()`)
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
         * Module index in this package (key for name & value for index)
         *
         * @type {Object}
         */
        this.module = { };
    }

    /**
     * @protected
     *
     * @param {string} modName - Path of a module
     *
     * @return {Module} New or loaded module
     */
    register(modName) {

        const index = this.module[ modName ];  var module;

        if (index != null)
            module = Array.prototype.splice.call(this, -index, 1)[0];
        else
            module = new Module(modName, this.base, this.includeAll);

        Array.prototype.unshift.call(this, module);

        this.module[ modName ] = this.length;

        return module;
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
     * @param {Module} module
     * @param {Module} parent
     *
     * @return {boolean} Whether `module` has a circular dependency
     */
    hasCircular(module, parent) {

        parent.children.push( module );

        try {  JSON.stringify( this.entry );  } catch (error) {

            if ( error.message.includes('circular') )
                return  (!! parent.children.pop());
        }
    }

    /**
     * @protected
     *
     * @param {string}  modName - Path of a module
     * @param {?Module} parent  - Module depends `modName`
     */
    async parse(modName, parent) {

        const module = this.register( modName );

        if (parent  &&  this.hasCircular(module, parent))
            return  console.warn(`Module "${modName}" has a circular reference`);

        await module.parse();

        await Promise.all(
            module.dependencyPath.map(path  =>  this.parse(path, module))
        );
    }

    /**
     * @return {string} Factory code of this package
     */
    async bundle() {  /* eslint no-useless-escape: "off" */

        await this.parse(`./${basename( this.path )}`);

        return `function () {

    var module = {
        ${Array.from(
        this,  item => `'${item.name}':  {exports: { }}`
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
}`;
    }
}
