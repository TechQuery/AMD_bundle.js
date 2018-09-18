#! /usr/bin/env node

import Path from 'path';

import FS from 'fs-extra';

import Command from 'commander';

import '@babel/polyfill';

import Package from './Package';

import {
    packageOf, currentModulePath, configOf, patternOf
} from '@tech_query/node-toolkit';


const meta = packageOf( currentModulePath() ).meta;

Command
    .version( meta.version )
    .description( meta.description )
    .usage('[options] <entry file> [bundle file]')
    .arguments('<entry file> [bundle file]')
    .option(
        '-a, --include-all',
        'Bundle all dependencies (include those in "./node_modules/")'
    )
    .option('-c, --command-line',  'Bundle as a command script')
    .option('-s, --std-out',  'Write into "stdout" without logs')
    .parse( process.argv );


const entry_file = Command.args[0],
    module_map = (configOf( meta.name ) || '').moduleMap;

const bundle_file = (
        Command.args[1] ||
        Path.join(entry_file,  '../../',  Path.basename( entry_file ))
    ) + '.js',
    pack = new Package(
        entry_file,
        Command.includeAll,
        module_map  &&  patternOf(module_map),
        Command.stdOut
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
