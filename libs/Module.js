'use strict';

const  Path = require('path'),  FS = require('fs');



class Module {

    constructor(name) {

        this.name = name;    this.level = 0;

        this.parent = [ ];    this.child = [ ];
    }

    static name2var() {

        return  arguments[0].replace(/\W/g, '_');
    }

    parseParent(string, external) {

        if (! string)  return;

        var root = this.name.replace(/[^/\\]*$/, '');

        return  this.parent = string.trim().split(/\s*,\s*/).map(
            function (parent) {

                parent = parent.slice(1, -1);

                return  (external.indexOf( parent )  >  -1)  ?
                    parent  :  Path.normalize( Path.join(root, parent) );
            }
        );
    }

    convert(external) {

        var parentVar = '';

        this.source = FS.readFileSync(
            `${this.name}.js`,  {encoding: 'utf-8'}
        ).trim();

        this.source = this.source.replace(
            /define\((\s*\[([\s\S]*?)\]\s*,)?\s*function\s*\(([\s\S]*?)\)/,
            (function () {

                if (this.parseParent(arguments[2],  external || [ ]))
                    parentVar = arguments[3].trim().split(/\s*,\s*/);

                return  `(function (${parentVar  &&  parentVar.join(', ')})`;

            }).bind( this )
        );

        this.parent.referCount = parentVar.length;

        parentVar = this.parent.slice(0, parentVar.length);

        var exports;

        parentVar = parentVar.map(
            name  =>  ((! exports)  &&  (exports = (name === 'exports')))  ?
                '{ }'  :  Module.name2var( name )
        );

        this.source = this.source.replace(
            /^\}\);?/m,
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
            'return '  :  `var ${Module.name2var( this.name )} =`;

        this.source = this.source.replace(/^\(function/m,  `${toReturn} $&`);
    }

    toString() {  return  this.source || '';  }
}


module.exports = Module;
