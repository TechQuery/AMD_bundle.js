import {
    toRegExp, merge, getNPMFile, getNPMIndex, getNPMPackage
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
     * @test {merge}
     */
    it(
        'Merge module paths',
        ()  =>  merge('./../test//../', './example').should.be.equal('../example')
    );

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
