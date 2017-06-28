# AMD bundle

**A command-line tool for bundling up [AMD](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) modules**,
which is much easier to use than `r.js + almond` of [Require.js](https://github.com/requirejs).



## Recommended Usage


### Basic

```Shell
cd path/to/project/root

npm install amd-bundle --save-dev

cd path/to/project/source/code

amd-bundle path/to/project/bundle_name.js
```

`amd-bundle` will

 1. start bunding from the entry point `path/to/project/source/code/index.js`

 2. write into `path/to/project/bundle_name.js` with only one `define('bundle_name', [ ])` and `global.bundle_name` definition

 3. treat missing dependency files as external dependencies


### Advanced

First, install [Uglify-JS](https://www.npmjs.com/package/uglify-js) as a development dependency:

```Shell
npm install uglify-js --save-dev
```
Then, refer to [the `scripts` section of `package.json` in iQuery](https://github.com/TechQuery/iQuery.js/blob/master/package.json) and edit yours.

From now on, you can build your standalone release files (full source code, minimized code and source map) by executing a single command (`npm run build`).



## Typical Cases

 1. [iQuery.js](https://github.com/TechQuery/iQuery.js) (where the prototype of `amd-bundle` came from)

 2. [EasyWebApp.js](https://github.com/TechQuery/EasyWebApp.js)