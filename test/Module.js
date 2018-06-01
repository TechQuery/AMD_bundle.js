import Module from '../source/Module';


/**
 * @test {Module}
 */
describe('Module parser',  () => {

    var module;

    before(()  =>  (module = new Module('./index', './test/example/')).load());

    /**
     * @test {Module#parseAMD}
     */
    it('Parse AMD',  () => {

        module.parseAMD().should.be.eql( {'./a': 'A'} );

        (module + '').should.be.equal(`/* AMD module */

    var C = require('./c');

    return  {a: A, c: C, test: require('test')};
`);
    });

    /**
     * @test {Module#parseCJS}
     */
    it('Parse CommonJS',  () => {

        module.parseCJS().should.be.eql( {'./c': '_c'} );
    });

    /**
     * @test {Module#parse}
     */
    it('Parse all',  () => module.parse().should.be.equal(`

function (A, require, exports, module) {/* AMD module */

    var C = require('./c');

    return  {a: A, c: C, test: require('test')};
}`.trim())
    );

    /**
     * @test {Module#dependencyPath}
     */
    it('Get paths of the dependency',  () => {

        module.dependencyPath.should.be.eql( ['./a', './c'] );
    });

    /**
     * @test {Module#mapName}
     */
    it('Replace a dependency',  () => {

        module = new Module(
            './index',  './test/example/',  true,  new Map([['test', 'jquery']])
        );

        module.parse().should.be.equal(`

function (A, require, exports, module) {/* AMD module */

    var C = require('./c');

    return  {a: A, c: C, test: require('jquery')};
}`.trim());

        module.dependencyPath.should.be.containEql('jquery');
    });
});
