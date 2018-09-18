import Package from '../source/Package';

import {execSync} from 'child_process';

import {readFileSync, removeSync} from 'fs-extra';

var bundle_code;


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

        bundle_code = (new Package(
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

    const entry = 'node build/index test/example/index';

    it('Output to a file',  () => {

        (execSync(`${entry} test/example/build`) + '').should.be.startWith(`
√ Module "./index" has been bundled
√ Module "./a" has been bundled
√ Module "./libs/b" has been bundled
√ Module "./c" has been bundled`.trim()
        );
    });

    it(
        'Write into stdout without printing',
        ()  =>  (execSync(`${entry} -s`) + '').should.be.eql( bundle_code )
    );


    it('Replace a module by the map option',  () => {

        (execSync(`cross-env NODE_ENV=test  ${entry} test/example/build`) + '')
            .should.be.startWith(`
→ Module "test" will be replaced by "test4sample"
√ Module "./index" has been bundled
√ Module "./a" has been bundled
√ Module "./libs/b" has been bundled
√ Module "./c" has been bundled`.trim()
            );

        (readFileSync('test/example/build.js') + '').should.be.equal(
            bundle_code
                .replace(/test([^:(])/g, 'test4sample$1')
                .replace(/('|\.)index/g, '$1build')
        );
    });


    after(() => removeSync('test/example/build.js'));
});
