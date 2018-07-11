# AMD bundle

**A multiple-use tool for bundling up [AMD](https://github.com/amdjs/amdjs-api/blob/master/AMD.md), [CJS](http://wiki.commonjs.org/wiki/Modules) & ES 6 modules**,
which is much easier to use than [`r.js`](https://github.com/requirejs/r.js) with [Almond](https://github.com/requirejs/almond) or [AMDclean](https://github.com/gfranko/amdclean).

[![NPM Dependency](https://david-dm.org/TechQuery/AMD_bundle.js.svg)](https://david-dm.org/TechQuery/AMD_bundle.js)

[![NPM](https://nodei.co/npm/amd-bundle.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/amd-bundle/)



## Recommended Usage


### Basic

```Shell
cd path/to/project/root

npm install amd-bundle --save-dev

amd-bundle -a \
    path/to/project/source/entry \
    path/to/project/bundle/file
```

`amd-bundle` will

 1. start bundling from the entry point `path/to/project/source/entry.js`

 2. write into `path/to/project/bundle/file.js` with only one `define('file', [ ])` and `global.file` definition, just like [UMD](https://github.com/umdjs/umd) style

 3. treat `${process.cwd()}/node_modules/${module_full_name}` as a user's module to pack in


### More options

#### Command-line

 `amd-bundle --help`

    Usage: index [options] <entry file> [bundle file]

    Options:

      -V, --version                  output the version number
      -a, --include-all              Bundle all dependencies (include those in "./node_modules/")
      -m, --module-map <name pairs>  Map to replace some dependencies to others (For example:  old_1:new_1,/some_/i:new_2)
      -c, --command-line             Bundle as a command script
      -s, --std-out                  Write into "stdout" without logs
      -h, --help                     output usage information

#### JS Module

https://techquery.github.io/AMD_bundle.js/class/source/Package.js~Package.html#instance-method-bundle


### Advanced

Build **standalone release files** (Full source code, Minimized code & Source map) by executing a single command (`npm run build`).

#### Multiple bundles from one source

 - Development dependency: [UglifyJS](http://lisperator.net/uglifyjs/)

 - **NPM-scripts** reference: [iQuery.js](https://github.com/TechQuery/iQuery.js/blob/master/package.json#L39)

#### Bundle ECMAScript 6+ codes

 - Development dependency: [Babel](https://babeljs.io/)

 - **NPM-scripts** reference: [WebCell](https://github.com/EasyWebApp/WebCell/blob/master/package.json#L30)



## Typical Cases

 1. [iQuery.js](https://github.com/TechQuery/iQuery.js) (where the prototype of `amd-bundle` came from)

 2. [WebCell](https://github.com/EasyWebApp/WebCell) (where `v1.0` rewritten out)

 3. [EasyWebUI](https://github.com/TechQuery/EasyWebUI)
