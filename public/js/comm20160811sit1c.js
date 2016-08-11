//用于选择性加载版本require-config.js
var requireContent = "";
if (version.length > 0) {
    //如果标识版本号
    requireContent = "<script src='/js/lib/requirejs/require.js' data-main='/js/require-config"
        + version + ".js'></script>";
} else {
    requireContent = "<script src='/js/lib/requirejs/require.js' data-main='/js/require-config.js'></script>";
}
document.write(requireContent);