module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    electron: {
        osxBuild: {
            options: {
                name: 'DoorBell',
                dir: 'app',
                out: 'dist',
                version: '0.25.3',
                platform: 'darwin',
                arch: 'x64',
                overwrite: true
            }
        }
    }
  });

  grunt.registerTask('default', [
    'electron'
  ]);
};
