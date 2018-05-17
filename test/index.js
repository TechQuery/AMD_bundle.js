import {merge, getNPMFile, getNPMIndex, getNPMPackage} from '../libs/utility';

import Module from '../libs/Module';

import Package from '../libs/Package';


describe('Utility',  () => {
    /**
     * @test {merge}
     */
    it('Merge module paths',  () => {

        merge('./../test//../', './example').should.be.equal('../example');
    });

    /**
     * @test {getNPMFile}
     */
    it('Get path of JS modules',  () => {

        getNPMFile('test').should.be.equal('node_modules/test.js');
    });

    /**
     * @test {getNPMIndex}
     */
    it('Get "index.js" path of a module',  () => {

        getNPMIndex('koapache/source').should.be.equal(
            'node_modules/koapache/source/index.js'
        );
    });

    /**
     * @test {getNPMPackage}
     */
    it('Get entry file path from "package.json" of a module',  () => {

        getNPMPackage('koapache').should.be.equal(
            'node_modules/koapache/source/index.js'
        );
    });
});


/**
 * @test {Module}
 */
describe('Module parser',  () => {

    var module;

    before(()  =>  (module = new Module('index', './test/example/')).load());

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

        module.parseCJS().should.be.eql( {'./c': 'C'} );
    });

    /**
     * @test {Module#parse}
     */
    it('Parse all',  () => module.parse().should.be.fulfilledWith(`

function index(A, require, exports, module) {/* AMD module */

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
});


/**
 * @test {Package}
 */
describe('Package bundler',  () => {

    var pack = new Package('');

    /**
     * @test {Package#register}
     */
    it('Register module',  () => {

        pack.register('a');

        pack.register('b');

        pack.register('c');

        pack.register('b');

        Array.from(pack,  module => module.name).should.be.eql(['b', 'c', 'a']);
    });

    /**
     * @test {Package#parse}
     */
    it('Parse package',  async () => {

        pack = new Package('./test/example/index');

        await pack.parse('./index');

        Array.from(pack,  module => module.name).should.be.eql([
            './c',  './libs/b',  './a',  './index'
        ]);
    });

    /**
     * @test {Package#bundle}
     */
    it('Evaluate factory function',  async () => {

        const factory = await (new Package('./test/example/index', true)).bundle();

        try {
            eval(`(${factory})()`).should.be.eql({
                a:     'This is A',
                c:     'This is C',
                test:  {test: 1}
            });
        } catch (error) {

            console.warn( factory );  throw error;
        }
    });
});
