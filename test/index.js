import Module from '../libs/Module';

import Package, {join} from '../libs/Package';


/**
 * @test {Module}
 */
describe('Module parser',  () => {

    var module;

    before(() => {

        module = new Module('index', './test/example/');

        return module.load();
    });

    /**
     * @test {Module#parseAMD}
     */
    it('Parse AMD',  async () => {

        module.parseAMD().should.be.eql( {a: 'A'} );

        (module + '').should.be.equal(`/* AMD module */

    var C = require('./c');

    return  {a: A, c: C};
`);
    });

    /**
     * @test {Module#parseCJS}
     */
    it('Parse CommonJS',  () => {

        module.parseCJS().should.be.eql( ['c'] );
    });

    /**
     * @test {Module#parse}
     */
    it('Parse all',  () => {

        module.dependency.runtime.length = 0;

        return module.parse().should.be.fulfilledWith(`
function index(A, require, exports, module) {/* AMD module */

    var C = require('./c');

    return  {a: A, c: C};
}`.trim());
    });

    /**
     * @test {Module#dependencyPath}
     */
    it('Get paths of the dependency',  () => {

        module.dependencyPath.should.be.eql( ['a', 'c'] );
    });
});


describe('Package bundler',  () => {

    var pack = new Package('');

    /**
     * @test {Package#register}
     */
    it('Register module',  () => {

        pack.register({name: './a'});

        pack.register({name: './b'});

        pack.register({name: './c'});

        pack.register({name: './b'});

        Array.from( pack ).should.be.eql([
            {name: './b'},  {name: './c'},  {name: './a'}
        ]);
    });

    /**
     * @test {Package#parse}
     */
    it('Parse package',  async () => {

        pack = new Package('./test/example/index');

        await pack.parse('index');

        Array.from(pack,  module => module.name).should.be.eql([
            'c',  'libs/b',  'a',  'index'
        ]);
    });

    it('Join module paths',  async () => {

        join('./../test//../', './example').should.be.equal('../example');
    });
});
