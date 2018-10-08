import Package from '../source/Package';

import {execSync} from 'child_process';

import {readFileSync, outputFileSync, removeSync} from 'fs-extra';


const bundle_code = (readFileSync('./test/example/bundle.js') + '').trim();

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

        Array.from(pack,  module => module.name).should.be.eql(['c', 'b', 'a']);
    });

    /**
     * @test {Package#parse}
     */
    it('Parse package',  () => {

        pack = new Package('./test/example/index', null, null, true);

        pack.parse('./index');

        Array.from(pack,  module => module.name).should.be.eql([
            './c', './libs/b', './a', './index'
        ]);
    });


    function testBundle(all) {

        const bundle_code = (new Package(
            './test/example/index', all, null, true
        )).bundle();

        try {
            eval( bundle_code ).should.be.eql({
                a:     'This is A',
                c:     'This is C',
                test:  {test: 1}
            });
        } catch (error) {

            console.warn( bundle_code );  throw error;
        }
    }

    /**
     * @test {generate}
     */
    it('Bundle all dependencies',  testBundle.bind(null, true));

    /**
     * @test {Package#bundle}
     */
    it('Bundle without NPM packages',  testBundle.bind(null, false));
});


describe('Command line',  () => {

    const entry = 'node build/index test/example/',
        output = 'test/example/build';

    it('Output to a file',  () => {

        (execSync(`${entry}index ${output}`) + '').should.be.startWith(`
√ Module "./index" has been bundled
√ Module "./a" has been bundled
√ Module "./libs/b" has been bundled
√ Module "./c" has been bundled`.trim()
        );
    });

    it(
        'Write into `stdout` without printing',
        ()  =>  (execSync(`${entry}index -s`) + '').should.be.eql(
            bundle_code
                .replace(/build/g, 'index')
                .replace(/test4sample/g, 'test')
        )
    );


    it('Replace a module by the map option',  () => {

        (execSync(`cross-env NODE_ENV=test  ${entry}index ${output}`) + '')
            .should.be.startWith(`
→ Module "test" will be replaced by "test4sample"
√ Module "./index" has been bundled
√ Module "./a" has been bundled
√ Module "./libs/b" has been bundled
√ Module "./c" has been bundled`.trim()
            );

        (readFileSync(`${output}.js`) + '').should.be.equal( bundle_code );
    });


    it('Handle "Hash bang" automatically',  () => {

        const code = execSync(`${entry}command -s`) + '';

        code.match( /#! \/usr\/bin\/env node/g ).should.have.length( 1 );

        outputFileSync(`${output}.js`, code);

        JSON.parse( execSync(`node ${output}`) ).should.be.eql({
            a:     'This is A',
            c:     'This is C',
            test:  {test: 1}
        });
    });

    after(() => removeSync('test/example/build.js'));
});
