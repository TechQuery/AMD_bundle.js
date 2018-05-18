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
    .option('-s, --std-out',  'Write into "stdout" without logs')
    .parse( process.argv );


const entry_file = Command.args[0];

const bundle_file = Path.join(
    Command.args[1]  ?  Command.args[1]  :  Path.join(entry_file, '../../'),
    Path.basename( entry_file ) + '.js'
);

if (! Command.stdOut)  console.time('Package bundle');

new Package(entry_file,  Command.includeAll,  Command.stdOut).bundle().then(
    code => {
        if ( Command.stdOut )
            process.stdout.write( code );
        else {
            FS.outputFileSync(bundle_file,  code);

            console.info( '-'.repeat( 30 ) );

            console.timeEnd('Package bundle');
        }
    }
);
