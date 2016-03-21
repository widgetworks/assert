var sharedConfig = require('pipe/karma');

module.exports = function(config) {
  sharedConfig(config);
  
  config.set({
    typescriptPreprocessor: {
      options: {
        target: 'es5',
        module: 'amd'
      },
      typings: [
        'typings/jasmine/jasmine.d.ts'
      ],
      // transforming the filenames
      transformPath: function(path) {
        return path.replace(/\.ts$/, '.js');
      }
    }
  });

  config.set({
    // list of files / patterns to load in the browser
    files: [
      'test-main.js',

      {pattern: 'src/**/*.ts', included: false},
      {pattern: 'test/**/*.ts', included: false}
    ],

    usePolling: true,

    preprocessors: {
      // 'src/**/*.js': ['traceur'],
      // 'test/**/*.js': ['traceur']
      'src/**/*.ts': ['typescript'],
      'test/**/*.ts': ['typescript']
    }
  });

  config.sauceLabs.testName = 'assert';
};
