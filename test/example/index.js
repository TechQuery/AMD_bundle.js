/* AMD module */
define(['./a', 'require', 'exports', 'module'],  function (A, require) {

    var C = require('./c');

    return  {a: A, c: C};
});
