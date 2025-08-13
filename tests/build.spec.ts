import * as path from 'path';

let fs: typeof import('fs-extra');

describe('readManifest', () => {
    const webpackConfigPath = path.resolve(__dirname, '..', 'webpack.config.js');
    const manifestPath = path.resolve(__dirname, '..', 'src', 'manifest.json');
    const originalArgv = process.argv;

    beforeEach(() => {
        jest.resetModules();
        fs = require('fs-extra');
        process.argv = ['node', 'webpack.config.js', '--joplin-plugin-config', 'buildMain'];
    });

    afterEach(() => {
        process.argv = originalArgv;
        jest.restoreAllMocks();
    });

    test('loads config when manifest is valid', () => {
        expect(() => require(webpackConfigPath)).not.toThrow();
    });

    test('throws if manifest id is missing', () => {
        const realReadFileSync = fs.readFileSync;
        jest.spyOn(fs, 'readFileSync').mockImplementation((p: any, options: any) => {
            if (p === manifestPath) return JSON.stringify({});
            return realReadFileSync(p, options);
        });
        expect(() => require(webpackConfigPath)).toThrow(/Manifest plugin ID is not set/);
    });
});
