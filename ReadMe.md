# AMD bundle

**A command-line tool for bundling up [AMD](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) modules**,
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
    path/to/project/bundle/folder
```

`amd-bundle` will

 1. start bundling from the entry point `path/to/project/source/entry.js`

 2. write into `path/to/project/bundle/folder/entry.js` with only one `define('entry', [ ])` and `global.entry` definition, just like [UMD](https://github.com/umdjs/umd) style

 3. treat `${process.cwd()}/node_modules/${module_full_name}` as a user's module to pack in


### More options

Option `-f` accepts a path of CommonJS Module as shown below:

```JavaScript
module.exports = function () {

    //  "this" is a instance of Module

    //  Change some code

    if (/pattern_A/.test( this.name ))
        return  this.source.replace('xxx', 'yyy');

    //  Remove a module

    if (this.parent.indexOf('zzz') > -1)
        return '';
};
```

### Advanced

Build **standalone release files** (Full source code, Minimized code & Source map) by executing a single command (`npm run build`).

#### Multiple bundles from one source

 - Development dependency: [UglifyJS](http://lisperator.net/uglifyjs/)

 - **NPM-scripts** reference: [iQuery.js](https://github.com/TechQuery/iQuery.js/blob/master/package.json#L22)

#### Bundle ECMAScript 6+ codes

 - Development dependency: [Babel](https://babeljs.io/)

 - **NPM-scripts** reference: [EasyWebApp.js](https://github.com/TechQuery/EasyWebApp.js/blob/V5/package.json#L6)



## Typical Cases

 1. [iQuery.js](https://github.com/TechQuery/iQuery.js) (where the prototype of `amd-bundle` came from)

 2. [WebCell](https://github.com/EasyWebApp/WebCell) (where `v1.0` rewritten out)

 3. [EasyWebUI](https://github.com/TechQuery/EasyWebUI)
