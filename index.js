#! /usr/bin/env node

console.log('');


const  Path = require('path'),  FS = require('fs');


const  Package = require('./libs/Package'),  Module = require('./libs/Module');

const  bundle = (
           new Package('index',  (process.argv[4] || '').split(','))
       ).parse(),
       out_name = process.argv[2];


var name = Path.basename( out_name ).split('.')[0],
    out_dep = {
        AMD:        bundle.getDependency(function () {

            return `'${this.name}'`;
        }),
        CJS:        bundle.getDependency(function () {

            return `require('${this.name}')`;
        }),
        global:     bundle.getDependency(function () {

            return `this['${this.name}']`;
        }),
        factory:    bundle.getDependency(function () {

            return  Module.name2var( this.name );
        })
    };

FS.writeFileSync(out_name, `
//
//  Generated by https://www.npmjs.com/package/amd-bundle
//
(function (factory) {

    if ((typeof define === 'function')  &&  define.amd)
        define('${name}',${
            out_dep.AMD  ?  `  [${out_dep.AMD}], `  :  ''
        } factory);
    else if (typeof module === 'object')
        module.exports = factory(${out_dep.CJS});
    else
        this.${name} = factory(${out_dep.global});

})(function (${out_dep.factory}) {


${bundle.check()}
});
`.trim());