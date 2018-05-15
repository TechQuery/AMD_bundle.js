import {dirname, join} from 'path';

import {readFile} from 'fs';

import {promisify} from 'util';

const loadFile = promisify( readFile ), AMD_CJS = ['require', 'exports', 'module'];



export default  class Module {

    constructor(name, path) {

        this.name = name;

        this.base = dirname( name ).replace(/\\/g, '/');

        this.path = path;

        this.dependency = {
            compile:  { },
            runtime:  [ ]
        };
    }

    get identifier() {

        return  this.name.replace(/[./]+/g, '_').replace(/^_/, '');
    }

    get dependencyPath() {

        return  Object.keys( this.dependency.compile )
            .concat( this.dependency.runtime );
    }

    async load() {

        return  this.source = await loadFile(
            join(this.path, `${this.name}.js`),  {encoding: 'utf-8'}
        );
    }

    prefix(name) {

        return  join(this.base, name).replace(/\\/g, '/');
    }

    parseAMD() {

        const dependency = this.dependency.compile;

        this.source = this.source.replace(
            /define\((?:\s*\[([\s\S]*?)\]\s*,)?\s*function\s*\(([\s\S]*?)\)\s*\{([\s\S]+)\}\s*\);?/,
            (_, modName, varName, body) => {

                var index = 0;  varName = varName.trim().split( /\s*,\s*/ );

                modName.replace(/(?:'|")(.+?)(?:'|")/g,  (_, name) => {

                    if (! AMD_CJS.includes( name ))
                        dependency[this.prefix( name )] = varName[ index ];

                    index++;
                });

                return  body.replace(/\r\n/g, '\n').replace(/^\n([\s\S]+)\n$/, '$1');
            }
        );

        return dependency;
    }

    parseCJS() {

        const dependency = this.dependency.runtime;

        this.source.replace(
            /(?:=\s*)?require\(\s*(?:'|")(.+?)(?:'|")\s*\)/mg,  (match, modName) => {

                dependency.push( this.prefix( modName ) );

                return match;
            }
        );

        return dependency;
    }

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

    toString() {

        return  ('source' in this)  ?  (this.source + '')  :  '';
    }
}
