/*global module:false*/
module.exports = function (grunt) {
    var version = '20160811sit1c'; //版本标识,与index.html中的version相对应
    // Project configuration.
    grunt.initConfig({

        bower: {
            install: {
                options: {
                    targetDir: './public/js/lib',
                    layout: 'byComponent',
                    install: true,
                    verbose: false,
                    cleanTargetDir: false,
                    cleanBowerDir: false,
                    bowerOptions: {}
                }
            }
        },

        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
        // Task configuration.
        // concat: {
        //   options: {
        //     banner: '<%= banner %>',
        //     stripBanners: true
        //   },
        //   dist: {
        //     src: ['lib/<%= pkg.name %>.js'],
        //     dest: 'dist/<%= pkg.name %>.js'
        //   }
        // },
        // uglify: {
        //   options: {
        //     banner: '<%= banner %>'
        //   },
        //   dist: {
        //     src: '<%= concat.dist.dest %>',
        //     dest: 'dist/<%= pkg.name %>.min.js'
        //   }
        // },

        //清除目录
        clean: {
            js: ['public/js/*' + version + '.js',
                'public/js/app/*' + version + '.js',
                'public/js/app/controllers/*' + version + '.js',
                'public/js/app/services/*' + version + '.js'],
            css: 'public/dist/css/style' + version + '.css',
            html: ['public/html/build/print' + version + '.html',
                  'public/js/app/template/*' + version + '.html']
        },

        //合并js与css,暂时只用于打版本号
        concat: {
            options: {
                separator: ';',
                stripBanners: true
            },
            distOcsApp: {
                src: [
                    "public/js/ocsApp.js"
                ],
                dest: "public/js/ocsApp" + version + ".js"
            },
            distComm: {
                src: [
                    "public/js/comm.js"
                ],
                dest: "public/js/comm" + version + ".js"
            },
            printHtml: {
                src: [
                    "public/html/build/print.html"
                ],
                dest: "public/html/build/print" + version + ".html"
            }
            // accessHtml: {
            //     src: [
            //         "public/js/app/template/access.html"
            //     ],
            //     dest: "public/js/app/template/access" + version + ".html"
            // },
            // batchOrderResultModalHtml: {
            //     src: [
            //         "public/js/app/template/batchOrderResultModal.html"
            //     ],
            //     dest: "public/js/app/template/batchOrderResultModal" + version + ".html"
            // },
            // confirmHtml: {
            //     src: [
            //         "public/js/app/template/confirm.html"
            //     ],
            //     dest: "public/js/app/template/confirm" + version + ".html"
            // },
            // modalHtml: {
            //     src: [
            //         "public/js/app/template/modal.html"
            //     ],
            //     dest: "public/js/app/template/modal" + version + ".html"
            // },
            // modifyAddressHtml: {
            //     src: [
            //         "public/js/app/template/modifyAddress.html"
            //     ],
            //     dest: "public/js/app/template/modifyAddress" + version + ".html"
            // },
            // orderListTableHtml: {
            //     src: [
            //         "public/js/app/template/orderListTable.html"
            //     ],
            //     dest: "public/js/app/template/orderListTable" + version + ".html"
            // },
            // progressHtml: {
            //     src: [
            //         "public/js/app/template/progress.html"
            //     ],
            //     dest: "public/js/app/template/progress" + version + ".html"
            // }
            // style: {
            //     src: [
            //         "public/dist/css/style.css"
            //     ],
            //     dest: "public/dist/css/style" + version + ".css"
            // }
        },

        //压缩js
        uglify: {
            //文件头部输出信息
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                separator: ';',
                stripBanners: false
            },
            target_main: {
                files: [
                    {
                        expand: true,
                        //相对路径
                        cwd: 'public/js',
                        src: 'require-config.js',
                        dest: 'public/js/',
                        rename: function (dest, src) {
                            var folder = src.substring(0, src.lastIndexOf('/'));
                            var filename = src.substring(src.lastIndexOf('/'), src.length);
                            filename = filename.substring(0, filename.lastIndexOf('.'));
                            var fileresult = dest + folder + filename + version + '.js';
                            grunt.log.writeln("现处理文件：" + src + "  处理后文件：" + fileresult);
                            return fileresult;
                        }
                    }
                ]
            },
            target_app: {
                files: [
                    {
                        expand: true,
                        //相对路径
                        cwd: 'public/js/app',
                        src: '*.js',
                        dest: 'public/js/app/',
                        rename: function (dest, src) {
                            var folder = src.substring(0, src.lastIndexOf('/'));
                            var filename = src.substring(src.lastIndexOf('/'), src.length);
                            filename = filename.substring(0, filename.lastIndexOf('.'));
                            var fileresult = dest + folder + filename + version + '.js';
                            grunt.log.writeln("现处理文件：" + src + "  处理后文件：" + fileresult);
                            return fileresult;
                        }
                    }
                ]
            },
            target_controllers: {
                files: [
                    {
                        expand: true,
                        //相对路径
                        cwd: 'public/js/app/controllers',
                        src: '*.js',
                        dest: 'public/js/app/controllers/',
                        rename: function (dest, src) {
                            var folder = src.substring(0, src.lastIndexOf('/'));
                            var filename = src.substring(src.lastIndexOf('/'), src.length);
                            filename = filename.substring(0, filename.lastIndexOf('.'));
                            var fileresult = dest + folder + filename + version + '.js';
                            grunt.log.writeln("现处理文件：" + src + "  处理后文件：" + fileresult);
                            return fileresult;
                        }
                    }
                ]
            },
            target_services: {
                files: [
                    {
                        expand: true,
                        //相对路径
                        cwd: 'public/js/app/services',
                        src: '*.js',
                        dest: 'public/js/app/services/',
                        rename: function (dest, src) {
                            var folder = src.substring(0, src.lastIndexOf('/'));
                            var filename = src.substring(src.lastIndexOf('/'), src.length);
                            filename = filename.substring(0, filename.lastIndexOf('.'));
                            var fileresult = dest + folder + filename + version + '.js';
                            grunt.log.writeln("现处理文件：" + src + "  处理后文件：" + fileresult);
                            return fileresult;
                        }
                    }
                ]
            }
            // target_directives: {
            //     files: [
            //         {
            //             expand: true,
            //             //相对路径
            //             cwd: 'public/js/app/directives',
            //             src: '*.js',
            //             dest: 'dest/js/directives/',
            //             rename: function (dest, src) {
            //                 var folder = src.substring(0, src.lastIndexOf('/'));
            //                 var filename = src.substring(src.lastIndexOf('/'), src.length);
            //                 filename = filename.substring(0, filename.lastIndexOf('.'));
            //                 var fileresult = dest + folder + filename + version + '.js';
            //                 grunt.log.writeln("现处理文件：" + src + "  处理后文件：" + fileresult);
            //                 return fileresult;
            //             }
            //         }
            //     ]
            // }
        },

        //压缩CSS
        cssmin: {
            prod: {
                options: {
                    report: 'gzip'
                },
                files: [
                    {
                        expand: true,
                        cwd: 'public/dist/css',
                        src: ['style.css'],
                        dest: 'public/dist/css/',
                        rename: function (dest, src) {
                            var folder = src.substring(0, src.lastIndexOf('/'));
                            var filename = src.substring(src.lastIndexOf('/'), src.length);
                            filename = filename.substring(0, filename.lastIndexOf('.'));
                            var fileresult = dest + folder + filename + version + '.css';
                            grunt.log.writeln("现处理文件：" + src + "  处理后文件：" + fileresult);
                            return fileresult;
                        }
                    }
                ]
            }
        },

        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: true,
                boss: true,
                eqnull: true,
                browser: true,
                globals: {
                    jQuery: true
                }
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            all: [
                'public/js/*.js'
            ],
            lib_test: {
                src: ['lib/**/*.js', 'test/**/*.js']
            }
        },
        qunit: {
            files: ['test/**/*.html']
        },
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            lib_test: {
                files: '<%= jshint.lib_test.src %>',
                tasks: ['jshint:lib_test', 'qunit']
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    //grunt.loadNpmTasks('grunt-contrib-qunit');
    // grunt.loadNpmTasks('grunt-contrib-jshint');
    // grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.loadNpmTasks('grunt-bower-task');

    // Default task.
    grunt.registerTask('default', ['clean', 'concat', 'uglify', 'cssmin']);

};
