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
    it('should exclude symlink paths', (done) => {
      const paths = glob.sync(path.join(__dirname,'/fixtures/**/*'));
      const globExpected = [
        path.join(__dirname, '/fixtures/binary.dat'),
        path.join(__dirname, '/fixtures/test_symlink.js'),
        path.join(__dirname, '/fixtures/test.js')
      ];
      assert.deepEqual(paths, globExpected);

      const expected = [
        path.join(__dirname, '/fixtures/binary.dat'),
        path.join(__dirname, '/fixtures/test.js')
      ];
      const nonSymlinks = engine.prunePathsWithinSymlinks(paths);
      assert.deepEqual(nonSymlinks, expected);
      done();
    });
  });

  describe('#inclusionBasedFileListBuilder', () => {
    it('should only contain a single path from fixtures', (done) => {
      const expected = [path.join(__dirname, '/fixtures/test.js')];
      const includedPaths = engine.inclusionBasedFileListBuilder();
      assert.deepEqual(includedPaths, expected);
      done();
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
  });

});
