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

    parseParent(string) {

        if (! string)  return;

        var root = this.name.replace(/[^\/\\]*$/, '');

        return  this.parent = string.trim().split(/\s*,\s*/).map(
            function () {
                return Path.normalize(
                    Path.join(root,  arguments[0].slice(1, -1))
                );
            }
        );
    }

    convert() {
        var parentVar = '';

        this.source = FS.readFileSync(
            `${this.name}.js`,  {encoding: 'utf-8'}
        ).trim();

        this.source = this.source.replace(
            /define\((\s*\[([\s\S]*?)\]\s*,)?\s*function\s*\(([\s\S]*?)\)/,
            (function () {

                if (this.parseParent( arguments[2] ));
                    parentVar = arguments[3].trim().split(/\s*,\s*/);

                return  `var ${Module.name2var( this.name )} = (function (${
                    parentVar  &&  parentVar.join(', ')
                })`;
            }).bind( this )
        );

        parentVar = this.parent.slice(0, parentVar.length);

        this.source = this.source.replace(
            /^\}\);?/m,  `})(${parentVar.map( Module.name2var ).join(', ')});`
        );

        return this;
    }

    toString() {  return this.source;  }
}


module.exports = Module;