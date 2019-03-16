#! /usr/bin/env node

import '@babel/polyfill';

import Command from 'commander';

import { meta } from './utility';

import { join, basename } from 'path';

import Package from './Package';

import { uglify } from '@tech_query/node-toolkit';

import { outputFileSync } from 'fs-extra';


Command
    .name( meta.name )
    .version( meta.version )
    .description( meta.description )
    .usage('[options] <entry file> [bundle file]')
    .arguments('<entry file> [bundle file]')
    .option(
        '-a, --include-all',
        'Bundle all dependencies (include those in "./node_modules/")'
    )
    .option('-m, --minify',  'Generate minified source code & source map')
    .option('-s, --std-out',  'Write into "stdout" without logs')
    .parse( process.argv );


const entry_file = Command.args[0];

if (! entry_file)  Command.outputHelp(), process.exit(1);


const bundle_file = (
        Command.args[1] ||
        join(entry_file,  '../../',  basename( entry_file ))
    ),
    pack = new Package(entry_file, Command.includeAll, null, Command.stdOut);

if (! Command.stdOut)  console.time('Package bundle');

var bundle = pack.bundle( basename( bundle_file ) );

if ( Command.minify ) {

    const {code, map} = uglify(bundle, `${basename( bundle_file )}.js`);

    outputFileSync(`${bundle_file}.min.js`, code);

    outputFileSync(`${bundle_file}.js.map`, map);
}

if ( pack.entry.CLI )  bundle = `${pack.entry.CLI}\n\n${bundle}`;

if ( Command.stdOut )  process.stdout.write( bundle ), process.exit();

outputFileSync(`${bundle_file}.js`,  bundle);

console.info( '-'.repeat( 30 ) );

console.timeEnd('Package bundle');

console.info(`Module count: ${pack.length}`);
