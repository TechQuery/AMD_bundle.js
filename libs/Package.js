import {basename, dirname} from 'path';

import Module from './Module';


export function join(base, path) {

    return  (base + '/' + path)
        .replace(/\/\//g, '/')
        .replace(/[^/\.]+\/\.\.\//g, '')
        .replace(/\.\//g,  function (match, index, input) {

            return  (input[index - 1]  ===  '.')  ?  match  :  '';
        });
}


export default  class Package {

    constructor(path) {

        this.path = path;

        this.base = dirname( path );

        this.length = 0;

        this.module = { };
    }

    register(modName) {

        const index = this.module[ modName ];  var module;

        if (index != null)
            module = Array.prototype.splice.call(this, -index, 1)[0];
        else
            module = new Module(modName, this.base);

        Array.prototype.unshift.call(this, module);

        this.module[ modName ] = this.length;

        return module;
    }

    get entry() {  return  this[this.length - 1];  }

    hasCircular(module, parent) {

        parent.children.push( module );

        try {  JSON.stringify( this.entry );  } catch (error) {

            if ( error.message.includes('circular') )
                return  (!! parent.children.pop());
        }
    }

    async parse(modName, parent) {

        const module = this.register( modName );

        if (parent  &&  this.hasCircular(module, parent))
            return  console.warn(`Module "${modName}" has a circular reference`);

        await module.parse();

        await Promise.all(
            module.dependencyPath.map(path  =>  this.parse(path, module))
        );
    }

    async bundle() {  /* eslint no-useless-escape: "off" */

        await this.parse( basename( this.path ) );

        return `function () {

    var module = {
        ${Array.from(
        this,  item => `'${item.name}':  {exports: { }}`
    ).join(',\n        ')}
    };

${join}

    function _require_(base, path) {

        return  module[join(base, path)].exports;
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
