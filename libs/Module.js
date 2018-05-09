'use strict';

const  Path = require('path'),  FS = require('fs');



class Module {

    constructor(path, name) {

        this.path = path,  this.name = name;

        this.level = 0,  this.parent = [ ],  this.child = [ ];
    }

    static variableOf(name) {  return  name.replace(/\W/g, '_');  }

    parseParent(string, external) {

        if (! string)  return;

        external = external.concat('exports');

        var root = this.name.replace(/[^/\\]*$/, '');

        return  this.parent = string.trim().split(/\s*,\s*/).map(parent => {

            parent = parent.slice(1, -1);

            return  (external.indexOf( parent )  >  -1)  ?
                parent  :  Path.normalize( Path.join(root, parent) );
        });
    }

    parseCJS() {

        const dependency = {module: ['exports'],  variable: ['exports']};

        this.source = this.source.replace(
            /^\s*(?:var|let|const) ([^{]+?);/mg,  (match, require) => {

                return (
                    require !== require.replace(
                        /(\w+) = require\((?:'|")(.+?)(?:'|")\)/g,
                        (_, varName, modName) => {

                            dependency.module.push( modName );

                            dependency.variable.push( varName );
                        }
                    )
                ) ? '' : match;
            }
        );

        this.source = `define(${
            JSON.stringify( dependency.module )
        },  function (${
            dependency.variable
        }) {${
            this.source
        }});`;

        return this;
    }

    parseAMD(external) {

        var AMD, parentVar = '';

        this.source = this.source.replace(
            /define\((?:\s*\[([\s\S]*?)\]\s*,)?\s*function\s*\(([\s\S]*?)\)/,
            (_, modName, varName) => {

                AMD = true;

                if (this.parseParent(modName,  external || [ ]))
                    parentVar = varName.trim().split(/\s*,\s*/);

                return  `(function (${parentVar  &&  parentVar.join(', ')})`;
            }
        );

        if (! AMD)  return  this.parseCJS().parseAMD( external );

        this.parent.referCount = parentVar.length;

        return  this.parent.slice(0, parentVar.length);
    }

    convert(external) {

        try {
            this.source = FS.readFileSync(
                Path.join(this.path, `${this.name}.js`)
            );
        } catch (error) {

            this.source = FS.readFileSync(`node_modules/${this.name}.js`);
        }

        this.source = this.source.toString('utf-8').trim();

        var parentVar = this.parseAMD( external ), exports;

        parentVar = parentVar.map(
            name  =>  ((! exports)  &&  (exports = (name === 'exports')))  ?
                '{ }'  :  Module.variableOf( name )
        );

        this.source = this.source.replace(
            /\}\);?$/,
            `${
                exports  ?  '\n    return exports;\n\n'  :  ''
            }})(${
                parentVar.join(', ')
            });`
        );

        return this;
    }

    export(toReturn) {

        if (! this.source)  return;

        toReturn = toReturn  ?
            'return '  :  `var ${Module.variableOf( this.name )} =`;

        this.source = this.source.replace(/^\(function/m,  `${toReturn} $&`);
    }

    toString() {  return  this.source || '';  }
}


module.exports = Module;
