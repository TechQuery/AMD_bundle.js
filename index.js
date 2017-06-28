#! /usr/bin/env node

console.log('');


const  Path = require('path'),  FS = require('fs');


const  Package = require('./libs/Package');

const  bundle = new Package('index'),  out_name = process.argv[2];


var name = Path.basename( out_name ).split('.')[0],
    out_dep = {
        AMD:       bundle.getDependence(function () {

            return `'${this.name}'`;
        }),
        CJS:       bundle.getDependence(function () {

            return `require('${this.name}')`;
        }),
        global:    bundle.getDependence(function () {

            return `this['${this.name}']`;
        })
    };

FS.writeFileSync(out_name, `

(function (factory) {

    if ((typeof define === 'function')  &&  define.amd)
        define('${name}',${out_dep.AMD  ?  ` [${out_dep.AMD}],`  :  ''} factory);
    else if (typeof module === 'object')
        module.exports = factory(${out_dep.CJS});
    else
        this.${name} = factory(${out_dep.global});

})(function () {


${bundle.check()}
});
`.trim());