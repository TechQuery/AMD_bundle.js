import {
    toRegExp, toES_5, merge, outPackage, getNPMFile, getNPMIndex, getNPMPackage
} from '../source/utility';



describe('Utility',  () => {
    /**
     * @test {toRegExp}
     */
    it('Create RegExp() from a literal string',  () => {

        toRegExp('/polyfill|ext\\//ig').should.be.eql( /polyfill|ext\//gi );

        (toRegExp('test') === undefined).should.be.true();
    });

    /**
     * @test {toES_5}
     */
    it('Transform ES 6+ module',  () => {

        toES_5(`
import 'babel-polyfill';

async function test() { }

`, true).should.be.equal(`

require('babel-polyfill');

async function test() {}`.trim());
    });

    /**
     * @test {merge}
     */
    it(
        'Merge module paths',
        ()  =>  merge('./../test//../', './example').should.be.equal('../example')
    );

    /**
     * @test {outPackage}
     */
    it('Determine package type by name',  () => {

        outPackage('./test').should.be.false();

        outPackage('../test').should.be.false();

        outPackage('/test').should.be.false();

        outPackage('test').should.be.true();

        outPackage('@example/test').should.be.true();
    });

    /**
     * @test {getNPMFile}
     */
    it(
        'Get path of JS modules',
        () => getNPMFile('test').should.be.equal('node_modules/test.js')
    );

    /**
     * @test {getNPMIndex}
     */
    it(
        'Get "index.js" path of a module',
        () => getNPMIndex('koapache/source').should.be.equal(
            'node_modules/koapache/source/index.js'
        )
    );

    /**
     * @test {getNPMPackage}
     */
    it(
        'Get entry file path from "package.json" of a module',
        () => getNPMPackage('koapache').should.be.equal(
            'node_modules/koapache/source/index.js'
        )
    );
});
