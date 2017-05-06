
const eclint = require('eclint');
const File = require('vinyl');
const glob = require('glob');
const fs = require('fs');
const isBinaryFile = require('isbinaryfile');
const createHash = require('sha.js');
const util = require('util');

class eclint_engine {

  constructor(engineConfig) {
    this.includePaths = engineConfig.include_paths;
    this.excludePaths = ['node_modules/', 'bower_components/', 'vendor/'];
  }

  check(fname) {
    const stream = eclint.check();

    stream.on('data', (file) => {
      if (file.editorconfig) {
        for (let err of file.editorconfig.errors) {
          const fileName = err.fileName.replace(/^\/code\//, '');
          const uniqueID = util.format('%s-%s-%d-%d', fileName, err.rule, err.lineNumber, err.columnNumber);
          const issue = {
            'categories': ['Style'],
            'check_name': err.rule,
            'description': err.message,
            'contents': {
              'body': 'See https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#' + err.rule
            },
            'location': {
              'positions': {
                'begin': {
                  'line': err.lineNumber,
                  'column': err.columnNumber
                },
                'end': {
                  'line': err.lineNumber,
                  'column': err.columnNumber
                }
              },
              'path': fileName
            },
            'fingerprint': createHash('sha256').update(uniqueID, 'utf8').digest('hex'),
            'type': 'issue'
          };

          console.log(JSON.stringify(issue) + '\0');
        }
      }
    });

    stream.write(new File({
      path: fname,
      contents: fs.readFileSync(fname)
    }));
  }

  isFileExcluded(fname) {
    for (let fpath of this.excludePaths) {
      if (fname.includes(fpath)) {
        return true;
      }
    }
    if (isBinaryFile.sync(fname) || fs.lstatSync(fname).isDirectory()) {
      return true;
    }
    return false;
  }

  prunePathsWithinSymlinks(paths) {
    // Extracts symlinked paths and filters them out, including any child paths
    const symlinks = paths.filter((path) => {
      return fs.lstatSync(path).isSymbolicLink();
    });

    return paths.filter((path) => {
      let withinSymlink = false;
      for (let symlink of symlinks) {
        if (path.indexOf(symlink) === 0) {
          withinSymlink = true;
        }
      }
      return !withinSymlink;
    });
  }

  inclusionBasedFileListBuilder() {
    // Uses glob to expand the files and directories in includePaths, filtering
    // down to match the list of desired files.
    const analysisFiles = [];

    const addAnalyzedFilesFromPaths = (paths) => {
      for (let file of this.prunePathsWithinSymlinks(paths)) {
        if (!this.isFileExcluded(file)) {
          analysisFiles.push(file);
        }
      }
    };

    for (let fileOrDirectory of this.includePaths) {
      if (fs.lstatSync(fileOrDirectory).isDirectory()) {
        const filesInThisDirectory = glob.sync(
          fileOrDirectory + "/**/**"
        );
        addAnalyzedFilesFromPaths(filesInThisDirectory);
      } else {
        const paths = [fileOrDirectory];
        addAnalyzedFilesFromPaths(paths);
      }
    }

    return analysisFiles;
  }

  run() {
    // Execute main loop and find fixmes in valid files
    for (let f of this.inclusionBasedFileListBuilder()) {
      this.check(f);
    }
  }

}

module.exports = eclint_engine;
