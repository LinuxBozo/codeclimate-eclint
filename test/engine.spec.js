const assert = require('assert');
const glob = require('glob');
const path = require('path');
const Engine = require('../lib/engine');

describe('Engine', () => {
  let config;
  let engine;

  beforeEach(() => {
    config = {
      include_paths: [path.join(__dirname, '/fixtures')]
    };
    engine = new Engine(config);
  });

  describe('#isFileExcluded', () => {
    it('should exclude nodejs dependencies', (done) => {
      const testpath = '/myproject/node_modules/foo';
      assert.ok(engine.isFileExcluded(testpath));
      done();
    });
    it('should exclude vendored dependencies', (done) => {
      const testpath = '/myproject/vendor/foo';
      assert.ok(engine.isFileExcluded(testpath));
      done();
    });

    it('should not exclude a regular file', (done) => {
      const testpath = path.join(__dirname, '/fixtures/test.js');
      assert.ok(!engine.isFileExcluded(testpath));
      done();
    });

    it('should exclude directories', (done) => {
      const testpath = path.join(__dirname,'/fixtures');
      assert.ok(engine.isFileExcluded(testpath));
      done();
    });

    it('should exclude binary files', (done) => {
      const testpath = path.join(__dirname,'/fixtures/binary.dat');
      assert.ok(engine.isFileExcluded(testpath));
      done();
    });
  });

  describe('#prunePathsWithinSymlinks', () => {
    it('should only exclude symlink paths', (done) => {
      const paths = glob.sync(path.join(__dirname,'/fixtures/**/*'));
      const globExpected = [
        path.join(__dirname, '/fixtures/binary.dat'),
        path.join(__dirname, '/fixtures/test_indent_size.js'),
        path.join(__dirname, '/fixtures/test_symlink.js'),
        path.join(__dirname, '/fixtures/test.js')
      ];
      assert.deepEqual(paths, globExpected);

      const expected = [
        path.join(__dirname, '/fixtures/binary.dat'),
        path.join(__dirname, '/fixtures/test_indent_size.js'),
        path.join(__dirname, '/fixtures/test.js')
      ];
      const nonSymlinks = engine.prunePathsWithinSymlinks(paths);
      assert.deepEqual(nonSymlinks, expected);
      done();
    });
  });

  describe('#inclusionBasedFileListBuilder', () => {
    it('should only contain a two files from whole fixtures path', (done) => {
      const expected = [
        path.join(__dirname, '/fixtures/test_indent_size.js'),
        path.join(__dirname, '/fixtures/test.js')
      ];
      const includedPaths = engine.inclusionBasedFileListBuilder();
      assert.deepEqual(includedPaths, expected);
      done();
    });
    it('should contain no files when fed only symlink', () => {
      config = {
        include_paths: [path.join(__dirname, '/fixtures/test_symlink.js')]
      };
      engine = new Engine(config);
      const includedPaths = engine.inclusionBasedFileListBuilder();
      assert.deepEqual(includedPaths, []);
    });
    it('should contain no files when fed only binary file', () => {
      config = {
        include_paths: [path.join(__dirname, '/fixtures/binary.dat')]
      };
      engine = new Engine(config);
      const includedPaths = engine.inclusionBasedFileListBuilder();
      assert.deepEqual(includedPaths, []);
    });
    it('should contain one file when fed single javascript file', () => {
      config = {
        include_paths: [path.join(__dirname, '/fixtures/test.js')]
      };
      engine = new Engine(config);
      const expected = [path.join(__dirname, '/fixtures/test.js')];
      const includedPaths = engine.inclusionBasedFileListBuilder();
      assert.deepEqual(includedPaths, expected);
    });
  });

  describe('#run', () => {
    it('should return a single issue for indent_size', (done) => {
      const oldLog = console.log;
      console.log = function (message) {
        let content = JSON.parse(message.replace(/\0/g, ''));
        assert.equal(content.check_name, 'indent_size');
        console.log = oldLog;
        done();
      };
      engine.run();
    });
    it('should return a single issue and have an unique fingerprint', (done) => {
      const oldLog = console.log;
      console.log = function (message) {
        let content = JSON.parse(message.replace(/\0/g, ''));
        assert.equal(content.fingerprint, '20330fefe3c979047d8f672f69d3209dc89fb8384ffb649717700ec253af80a4');
        console.log = oldLog;
        done();
      };
      engine.run();
    });
    it('should return a no issue when no valid files included', (done) => {
      config = {
        include_paths: [path.join(__dirname, '/fixtures/binary.dat')]
      };
      engine = new Engine(config);
      engine.run();
      assert(!console.log.isCalled);
      done();
    });
    it('should return a no issue when all files are valid', (done) => {
      config = {
        include_paths: [path.join(__dirname, '/fixtures/test.js')]
      };
      engine = new Engine(config);
      engine.run();
      assert(!console.log.isCalled);
      done();
    });
  });

});
