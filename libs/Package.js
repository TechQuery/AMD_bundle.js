'use strict';

const Module = require('./Module');



class Package extends Array {

    constructor(name, external) {

        super();

        Object.defineProperty(this,  '__name__',  {value: name});

        Object.defineProperty(this,  '__external__',  {value: external});
    }

    register(name) {

        (this[ name ] = new Module( name )).convert( this.__external__ );

        for (var ID  of  this[ name ].parent) {

            if (! this[ ID ])
                try {  this.register( ID );  } catch (error) { }

            this[ ID ].child.push( name );
        }
    }

    updateLevel(name) {

        return  this[name].level = this[name].level || this[name].child.reduce(
            (function (sum, cur) {

                return  sum  +  this.updateLevel( cur );

            }).bind( this ),
            1
        );
    }

    updateDependency() {

        this.sort(function (A, B) {

            return  B.level - A.level;

        }).forEach(function (_this_, index) {

            for (var i = index + 1, parent;  this[i];  i++) {

                parent = this[i].parent;  index = parent.indexOf( _this_.name );

                if (
                    parent.referCount  &&
                    (index > -1)  &&
                    (index < parent.referCount)
                ) {
                    _this_.export();    break;
                }
            }
        }, this);

        this[this.length - 1].export( true );
    }

    parse() {
        this.register( this.__name__ );

        for (var name  of  Object.keys( this )) {

            this.updateLevel( name );

            this.push( this[ name ] );
        }

        this.updateDependency();

        return this;
    }

    toString() {

        return  this.filter(function () {

            return arguments[0].source;

        }).join('\n\n\n');
    }

    getDependency(wrapper) {

        var out_dep = [ ];

        for (var module of this)
            if (! module.source)
                out_dep.push(
                    wrapper  ?  wrapper.call(module, module.name)  :  module.name
                );

        return  wrapper  ?  out_dep.join(', ')  :  out_dep;
    }

    check() {
        var out_dep = this.getDependency();

        this.forEach(function (module, index) {

            var parent = [ ].concat( module.parent );

            if (index && parent[0]) {

                for (var i = index - 1;  this[i];  i--) {

                    index = parent.indexOf( this[i].name );

                    if (index > -1)  parent.splice(index, 1);
                }

                if ( out_dep[0] )
                    parent = parent.filter(function () {

                        return  (out_dep.indexOf( arguments[0] )  <  0);
                    });
            }

            if ( parent[0] )
                throw  `[Dependence missing] ${
                    parent.join(', ')
                } of ${
                    module.name
                }`;
            else
                console.info(`[Module converted] ${module.name}\n`);
        }, this);

        return this;
    }
}


module.exports = Package;