'use strict';

const Module = require('./Module');



class Package extends Array {

    constructor(path, name, external) {

        Object.defineProperties(
            super(), {
                __path__:        {value:  path},
                __name__:        {value:  name},
                __external__:    {value:  external || [ ]}
            }
        ).parse();
    }

    register(name) {

        this[ name ] = new Module(this.__path__,  name);

        if (this.__external__.indexOf( name )  >  -1)  return;

        this[ name ].convert( this.__external__ );

        for (var ID  of  this[ name ].parent) {

            if (ID === 'exports') {

                this[ ID ] = ID;  continue;
            }

            if (! this[ ID ])  this.register( ID );

            this[ ID ].child.push( name );
        }
    }

    updateLevel(name) {

        return  this[name].level = this[name].level || this[name].child.reduce(
            (sum, cur)  =>  {
                try {
                    return  sum  +  this.updateLevel( cur );

                } catch (error) {
                    throw (
                        (error instanceof RangeError)  ?
                            ReferenceError(`"${name}" has a Circular reference`)  :
                            error
                    );
                }
            },
            1
        );
    }

    updateDependency() {

        this.sort((A, B)  =>  B.level - A.level).forEach((_this_, index)  =>  {

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
        });

        this[this.length - 1].export( true );
    }

    parse() {

        this.register( this.__name__ );

        for (var name  of  Object.keys( this )) {

            if (name === 'exports')  continue;

            this.updateLevel( name );

            this.push( this[ name ] );

            if (
                (! this[ name ].source)  &&
                (this.__external__.indexOf( name )  <  0)
            )
                this.__external__.push( name );
        }

        this.updateDependency();

        return this;
    }

    toString(filter) {

        filter = (filter instanceof Function)  &&  filter;

        var _this_ = [ ],  source;

        for (var module of this) {

            if ( filter )  source = filter.call( module );

            source = (source != null)  ?  source  :  module.source;

            if ( source )  _this_.push( source );

            source = null;
        }

        return _this_.join('\n\n\n');
    }

    getDependency(wrapper) {

        return  (wrapper instanceof Function)  ?
            this.__external__.map(
                name  =>  wrapper(name,  this[ name ])
            ).join(', ')  :
            this.__external__.slice( 0 );
    }

    check() {
        var out_dep = this.getDependency();

        this.forEach((module, index)  =>  {

            var parent = module.parent.filter(name => (name !== 'exports'));

            if (index && parent[0]) {

                for (var i = index - 1;  this[i];  i--) {

                    index = parent.indexOf( this[i].name );

                    if (index > -1)  parent.splice(index, 1);
                }

                if ( out_dep[0] )
                    parent = parent.filter(
                        name  =>  (out_dep.indexOf( name )  <  0)
                    );
            }

            if ( parent[0] )
                throw  `[Dependence missing] ${
                    parent.join(', ')
                } of ${
                    module.name
                }`;
            else
                console.info(`[Module converted] ${module.name}\n`);
        });

        return this;
    }
}


module.exports = Package;
