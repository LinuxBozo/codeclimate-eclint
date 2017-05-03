
const eclint = require('eclint');
const File = require('vinyl');
const glob = require('glob');
const fs = require('fs');
const isBinaryFile = require('isbinaryfile');

class eclint_engine {

  constructor(engineConfig) {
    this.excludePaths = ['node_modules/', 'bower_components/', 'vendor/'];

    // Check for existence of config.json, parse exclude paths if it exists
    if (engineConfig && engineConfig.exclude_paths) {
      this.excludePaths = engineConfig.exclude_paths;
    }
  }

  check(fname) {
    const stream = eclint.check();

    stream.on('data', (file) => {
      if (file.editorconfig) {
        for (let err of file.editorconfig.errors) {
          const issue = {
            'categories': ['Style'],
            'check_name': err.rule,
            'description': err.message,
            'location': {
              'lines': {
                'begin': err.lineNumber,
                'end': err.lineNumber
              },
              'path': err.fileName.replace(/^\/code\//, '')
            },
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
    return false;
  }

  // Uses glob to traverse code directory and find files to analyze,
  // excluding files passed in with by CLI config
  fileWalk(excludePaths) {
    const analysisFiles = [];
    const allFiles = glob.sync("/code/**/**", {});

    for (let fname of allFiles) {
      if(!this.isFileExcluded(fname)) {
        if(!fs.lstatSync(fname).isDirectory()) {
          if(!isBinaryFile.sync(fname)) {
            analysisFiles.push(fname);
          }
        }
      }
    }

    return analysisFiles;
  }

  run() {
    // Walk /code/ path and find files to analyze
    const analysisFiles = this.fileWalk();

    // Execute main loop and find fixmes in valid files
    for (let f of analysisFiles) {
      this.check(f);
    }
  }

}

module.exports = eclint_engine;
