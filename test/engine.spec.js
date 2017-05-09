const assert = require('assert');
const glob = require('glob');
const path = require('path');
const Engine = require('../lib/engine');

describe('Engine', () => {
  let config;
  let engine;
  let iobuff = [];

  const logger = (message) => {
    iobuff.push(message);
  };

  beforeEach(() => {
    config = {
      include_paths: [path.join(__dirname, '/fixtures')]
    };
    engine = new Engine(config, logger);
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
        path.join(__dirname, '/fixtures/test_multiple_issues.js'),
        path.join(__dirname, '/fixtures/test_symlink.js'),
        path.join(__dirname, '/fixtures/test.js')
      ];
      assert.deepEqual(paths, globExpected);

      const expected = [
        path.join(__dirname, '/fixtures/binary.dat'),
        path.join(__dirname, '/fixtures/test_indent_size.js'),
        path.join(__dirname, '/fixtures/test_multiple_issues.js'),
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
        path.join(__dirname, '/fixtures/test_multiple_issues.js'),
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
      engine = new Engine(config, logger);
      const includedPaths = engine.inclusionBasedFileListBuilder();
      assert.deepEqual(includedPaths, []);
    });
    it('should contain no files when fed only binary file', () => {
      config = {
        include_paths: [path.join(__dirname, '/fixtures/binary.dat')]
      };
      engine = new Engine(config, logger);
      const includedPaths = engine.inclusionBasedFileListBuilder();
      assert.deepEqual(includedPaths, []);
    });
    it('should contain one file when fed single javascript file', () => {
      config = {
        include_paths: [path.join(__dirname, '/fixtures/test.js')]
      };
      engine = new Engine(config, logger);
      const expected = [path.join(__dirname, '/fixtures/test.js')];
      const includedPaths = engine.inclusionBasedFileListBuilder();
      assert.deepEqual(includedPaths, expected);
    });
  });

  describe('#run', () => {
    beforeEach(() => {
      iobuff = [];
    });
    it('should return a single issue and have fingerprint', (done) => {
      config = {
        include_paths: [path.join(__dirname, '/fixtures/test_indent_size.js')]
      };
      engine = new Engine(config, logger);
      engine.run().then(() => {
        assert.equal(iobuff.length, 1);
        let issue = JSON.parse(iobuff[0].replace(/\0/g, ''));
        assert.equal(issue.check_name, 'indent_size');
        assert.equal(issue.fingerprint.length, 64);
        done();
      });
    });
    it('should return multiple issues', (done) => {
      config = {
        include_paths: [path.join(__dirname, '/fixtures/test_multiple_issues.js')]
      };
      engine = new Engine(config, logger);
      engine.run().then(() => {
        assert.equal(iobuff.length, 2);
        let issue0 = JSON.parse(iobuff[0].replace(/\0/g, ''));
        let issue1 = JSON.parse(iobuff[1].replace(/\0/g, ''));
        assert.equal(issue0.check_name, 'trim_trailing_whitespace');
        assert.equal(issue1.check_name, 'indent_size');
        done();
      });
    });
    it('should return no issue when all files are valid', (done) => {
      config = {
        include_paths: [path.join(__dirname, '/fixtures/test.js')]
      };
      engine = new Engine(config, logger);
      engine.run().then(() => {
        assert(!logger.isCalled);
        assert.equal(iobuff.length, 0);
        done();
      });
    });
    it('should return no issue when there are no valid files to analyze', (done) => {
      config = {
        include_paths: [path.join(__dirname, '/fixtures/binary.dat')]
      };
      engine = new Engine(config, logger);
      engine.run().then(() => {
        assert(!logger.isCalled);
        assert.equal(iobuff.length, 0);
        done();
      });
    });
  });

});
