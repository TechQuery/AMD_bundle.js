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
            runtime:  { }
        };

        this.children = [ ];
    }

    get identifier() {

        return  this.name.replace(/[./]+/g, '_').replace(/^_/, '');
    }

    get dependencyPath() {

        return  Object.keys( this.dependency.compile ).concat(
            Object.keys( this.dependency.runtime )
        );
    }

    async load() {

        return  this.source = await loadFile(
            join(this.path, `${this.name}.js`),  {encoding: 'utf-8'}
        );
    }

    addChild(type, name, varName) {

        this.dependency[ type ][ join(this.base, name).replace(/\\/g, '/') ] = varName;
    }

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

                return  body.replace(/\r\n/g, '\n').replace(/^\n([\s\S]+)\n$/, '$1');
            }
        );

        return this.dependency.compile;
    }

    parseCJS() {

        this.source.replace(
            /(?:(?:var|let|const)\s+(.+?)\s*=\s*)?require\(\s*(?:'|")(.+?)(?:'|")\s*\)/mg,
            (match, varName, modName)  =>
                this.addChild('runtime', modName, varName)  ||  match
        );

        return this.dependency.runtime;
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
