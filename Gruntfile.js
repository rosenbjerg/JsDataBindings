module.exports = function(grunt) {

    grunt.initConfig({
        babel: {
            options: {
                "sourceMap": true
            },
            dist: {
                files: [{
                    "expand": true,
                    "cwd": "src",
                    "src": ["*.js"],
                    "dest": "build/transpiled",
                    "ext": ".js"
                }]
            }
        },
        uglify: {
            dev: {
                options: {
                    sourceMap: true,
                    compress: true,
                    mangle: true,

                },
                files: [{
                    expand: true,
                    src: 'build/transpiled/*.js',
                    dest: '.',
                    cwd: '.',
                    rename: function (dst, src) {
                        // To keep src js files and make new files as *.min.js :
                        return dst + '/' + src.replace('.js', '.min.js');
                    }
                }]
            }
        },
    });

    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask("default", ["babel", "uglify"]);
};