#! /usr/bin/env node

const  Path = require('path'),  FS = require('fs-extra');

const  Command = require('commander'),  Config = require('../package.json');

require('babel-register');  require('babel-polyfill');

const  Package = require('./Package').default,  utility = require('./utility');


Command.version( Config.version ).usage('[options] <entry file> [bundle file]')
    .arguments('<entry file> [bundle file]')
    .option(
        '-a, --include-all',
        'Bundle all dependencies (include those in "./node_modules/")'
    )
    .option(
        '-m, --module-map <name pairs>',  [
            'Map to replace some dependencies to others',
            '(For example:  old_1:new_1,/some_/i:new_2)'
        ].join(' ')
    )
    .option('-c, --command-line',  'Bundle as a command script')
    .option('-s, --std-out',  'Write into "stdout" without logs')
    .parse( process.argv );


const entry_file = Command.args[0], module_map = new Map();

(Command.moduleMap || '').replace(
    /(.+?):([^,]+)/g,
    (_, oldName, newName)  =>
        module_map.set(utility.toRegExp( oldName ) || oldName,  newName)
);

const bundle_file = (
        Command.args[1] ||
        Path.join(entry_file,  '../../',  Path.basename( entry_file ))
    ) + '.js',
    pack = new Package(
        entry_file,  Command.includeAll,  module_map,  Command.stdOut
    );

if (! Command.stdOut)  console.time('Package bundle');

var code = pack.bundle( Path.basename( bundle_file ).split('.')[0] );

if ( Command.commandLine )  code = '#! /usr/bin/env node\n\n' + code;

if ( Command.stdOut )
    process.stdout.write( code );
else {
    FS.outputFileSync(bundle_file,  code);

    console.info( '-'.repeat( 30 ) );

    console.timeEnd('Package bundle');

    console.info(`Module count: ${pack.length}`);
}
