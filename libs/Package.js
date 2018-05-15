import {basename, dirname} from 'path';

import Module from './Module';


export function join(base, path) {

    return  (base + '/' + path)
        .replace(/\/\//g, '/')
        .replace(/[^/\.]+\/\.\.\//g, '')
        .replace(/^\.\/|\/\./g, '');
}


export default  class Package {

    constructor(path) {

        this.path = path;

        this.base = dirname( path );

        this.length = 0;

        this.module = { };
    }

    register(module) {

        const index = this.module[ module.name ];

        if (index != null)  Array.prototype.splice.call(this, -index, 1);

        Array.prototype.unshift.call(this, module);

        this.module[ module.name ] = this.length;
    }

    async parse(modName) {

        const module = new Module(modName, this.base);

        await module.parse();

        this.register( module );

        await Promise.all(
            module.dependencyPath.map(path  =>  this.parse( path ))
        );
    }

    async bundle() {  /* eslint no-useless-escape: "off" */

        await this.parse( basename( this.path ) );

        return `
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
            parent => `require('${parent}')`
        ).concat(
            `_require_.bind(null, '${item.name}')`,
            `require('${item.name}')`,
            `module['${item.name}']`
        ).join(', ')

    }) || require('${item.name}');`).join('\n\n    ')}
`;
    }
}
