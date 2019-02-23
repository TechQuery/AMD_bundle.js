# AMD bundle

**A multiple-use tool for bundling up [AMD](https://github.com/amdjs/amdjs-api/blob/master/AMD.md), [CJS](http://wiki.commonjs.org/wiki/Modules) & ES 6 modules**,
which is much easier to use than [`r.js`](https://github.com/requirejs/r.js) with [Almond](https://github.com/requirejs/almond) or [AMDclean](https://github.com/gfranko/amdclean).

[![NPM Dependency](https://david-dm.org/TechQuery/AMD_bundle.js.svg)](https://david-dm.org/TechQuery/AMD_bundle.js)
[![Build Status](https://travis-ci.com/TechQuery/AMD_bundle.js.svg?branch=master)](https://travis-ci.com/TechQuery/AMD_bundle.js)

[![NPM](https://nodei.co/npm/amd-bundle.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/amd-bundle/)



## Recommended Usage


### Basic

```Shell
cd path/to/project/root

npm install amd-bundle --save-dev

amd-bundle -a -m \
    path/to/project/source/entry \
    path/to/project/bundle/file
```

`amd-bundle` will

 1. start bundling from the entry point `path/to/project/source/entry.js`

 2. write into `path/to/project/bundle/file.js` with only one `define('file', [ ])` and `global.file` definition, just like [UMD](https://github.com/umdjs/umd) style

 3. treat `${process.cwd()}/node_modules/${module_full_name}` as a user's module to pack in

 4. generate `file.min.js` & `file.js.map` in `path/to/project/bundle/`


### More options

#### Command-line

`amd-bundle --help`

    Usage: amd-bundle [options] <entry file> [bundle file]

    Options:

        -V, --version      output the version number
        -a, --include-all  Bundle all dependencies (include those in "./node_modules/")
        -m, --minify       Generate minified source code & source map
        -s, --std-out      Write into "stdout" without logs
        -h, --help         output usage information

#### Configuration

[Example](https://github.com/TechQuery/AMD_bundle.js/blob/master/package.json#L75)

Key/value of option `moduleMap` is same as [the basic parameters of `String.prototype.replace()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Parameters).

#### JS Module

 - [API](https://tech-query.me/AMD_bundle.js/class/source/Package.js~Package.html#instance-method-bundle)

 - [Example 1](https://github.com/TechQuery/AMD_bundle.js/blob/master/source/index.js#L48)

 - [Example 2](https://github.com/EasyWebApp/DevCLI/blob/master/source/Component.js#L124)


### Advanced

Build **standalone release files** (Full source code, Minimized code & Source map) by executing a single command (`npm run build`).

#### Multiple bundles from one source

 - **NPM-scripts** reference: [iQuery.js](https://github.com/TechQuery/iQuery.js/blob/master/package.json#L26)

#### Bundle ECMAScript 6+ codes

 - Development dependency: [Babel](https://babeljs.io/)

 - **NPM-scripts** reference: [WebCell](https://github.com/EasyWebApp/WebCell/blob/master/package.json#L32)



## Typical Cases

 1. [iQuery.js](https://tech-query.me/iQuery.js/) (where the prototype of `amd-bundle` came from)

 2. [WebCell](https://web-cell.tk/) (where `v1.0` rewritten out)

 3. [WebCell DevCLI](https://easywebapp.github.io/DevCLI/) (where `v1.3+` came out)

[More use case](https://github.com/TechQuery/AMD_bundle.js/network/dependents)
