# AMD bundle

**A command-line tool for bundling up [AMD](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) modules**,
which is much easier to use than `r.js + almond` of [Require.js](https://github.com/requirejs).



## Quick Start

```Shell
cd path/to/project/root

npm install amd-bundle --save-dev

cd path/to/project/source/code

amd-bundle path/to/project/bundle_name.js
```

`amd-bundle` will start bunding from the entry point `path/to/project/source/code/index.js`, and then write into `path/to/project/bundle_name.js` with only one `define('bundle_name', [ ])` and `global.bundle_name` definition. Additional, missing dependency files are treated as 
external dependencies.



## Acknowledgment

Initially build with the development experience of [iQuery.js](https://github.com/TechQuery/iQuery.js) and [EasyWebApp.js](https://github.com/TechQuery/EasyWebApp.js).