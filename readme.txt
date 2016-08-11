此项目为顺丰同城配商家版web端,由AngularJs + RequireJs + Grunt构建

使用Grunt打包部署前请阅读本文件
通过npm install安装package.json中的grunt插件后,
执行grunt命令可对出lib外的业务js代码以及自行编写的css进行压缩.
Gruntfile.js中的version作为版本号标识,暂时默认为 version = "20160728",此version需要遵循以下准则:

请注意:为了使客户浏览器不缓存新发布的业务静态文件,本项目暂时在index.html中强制加入了version变量

var version = ""; //版本标识,仅当测试环境与生产环境时做此标识,与Gruntfile.js中的version对应

如果需要部署并发布到nginx测试环境或生产环境,请在index.html中为version赋值,并相应修改Gruntfile.js中的version,再执行grunt命令即可.