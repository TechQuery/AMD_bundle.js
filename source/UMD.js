import { toES_5 } from '@tech_query/node-toolkit';

import { merge, outPackage } from './utility';


function concatModule(pack, name, modName, varName) {  /* eslint-disable */

    return toES_5(`
var _module_ = { };
        ${
    Array.from(pack,  item => `
_module_['${item.name}'] = {
    base:        '${item.base}',
    dependency:  ${JSON.stringify( Object.keys( item.dependency.compile ) )}
};

_module_['${item.name}'].factory = ${item.source}`
    ).concat(
        modName.map((name, index)  =>
            `_module_['${name}'] = {exports: ${varName[index]}};`
        )
    ).join('\n')
}`,
        name
    );
}

/**
 * @param {Package}       pack
 * @param {string}        name    - Module name of bundled package
 * @param {string}        entry   - Name of entry module (before bundling)
 * @param {DependencyMap} outside
 *
 * @return {string} Bundled source with UMD wrapper
 */
export function generate(pack, name, entry, outside) {

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
        return  module.exports = factory.call(${
            ['global'].concat( modName.map(name => `require('${name}')`) )
        });
    else
        return  this['${name}'] = factory.call(${
            ['self'].concat( modName.map(name => `this['${name}']`) )
        });

})(function (${varName}) {

${merge}

${outPackage}

    var require = (typeof module === 'object') ?
        function () {

            return  module.require.apply(module, arguments);
        } : (
            this.require  ||  function (name) {

                if (self[name] != null)  return self[name];

                throw ReferenceError('Can\\'t find "' + name + '" module');
            }
        );

    var _include_ = include.bind(null, './');

    function include(base, path) {

        path = outPackage( path )  ?  path  :  ('./' + merge(base, path));

        var module = _module_[path], exports;

        if (! module)  return require(path);

        if (! module.exports) {

            module.exports = { };

            var dependency = module.dependency;

            for (var i = 0;  dependency[i];  i++)
                module.dependency[i] = _include_( dependency[i] );

            exports = module.factory.apply(
                null,  module.dependency.concat(
                    include.bind(null, module.base),  module.exports,  module
                )
            );

            if (exports != null)  module.exports = exports;

            delete module.dependency;  delete module.factory;
        }

        return module.exports;
    }

${concatModule(pack, name, modName, varName)}

    return _include_('${entry}');
});`.trim();
}
