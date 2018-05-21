#! /usr/bin/env node

const  Path = require('path'),  FS = require('fs-extra');

const  Command = require('commander'),  Config = require('./package.json');

require('babel-register');  require('babel-polyfill');

const  Package = require('./libs/Package').default;


Command.version( Config.version ).usage('[options] <file> [dir]')
    .arguments('<file> [dir]')
    .option(
        '-a, --include-all',
        'Bundle all dependencies (include those in "./node_modules/")'
    )
    .option(
        '-m, --module-map <name pairs>',  [
            'Map to replace some dependencies to others',
            '(For example:  old_1:new_1,old_2:new_2)'
        ].join(' ')
    )
    .option('-s, --std-out',  'Write into "stdout" without logs')
    .parse( process.argv );


const entry_file = Command.args[0], module_map = { };

(Command.moduleMap || '').replace(
    /(.+?):([^,]+)/g,
    (_, oldModule, newModule)  =>  module_map[ oldModule ] = newModule
);

const bundle_file = Path.join(
    Command.args[1]  ?  Command.args[1]  :  Path.join(entry_file, '../../'),
    Path.basename( entry_file ) + '.js'
);

if (! Command.stdOut)  console.time('Package bundle');

new Package(
    entry_file,  Command.includeAll,  module_map,  Command.stdOut
).bundle().then(code => {

    if ( Command.stdOut )
        process.stdout.write( code );
    else {
        FS.outputFileSync(bundle_file,  code);

        console.info( '-'.repeat( 30 ) );

        console.timeEnd('Package bundle');
    }
});
