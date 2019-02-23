import {
    merge, outPackage, getNPMFile, getNPMIndex, getNPMPackage
} from '../source/utility';



describe('Utility',  () => {
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
        () => getNPMIndex('commander').should.be.equal(
            'node_modules/commander/index.js'
        )
    );

    /**
     * @test {getNPMPackage}
     */
    it(
        'Get entry file path from "package.json" of a module',
        () => getNPMPackage('koapache').should.be.equal(
            'node_modules/koapache/dist/WebServer.js'
        )
    );
});
