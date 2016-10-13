/**
 * Created by Alexqiqing on 16/9/26.
 */
var systemConfig = (function ($) {
    var serverUrl = "http://10.118.60.73:8080"; //local
    // var serverUrl = "https://o2o.sit.sf-express.com:14443/api"; //sit
    // var serverUrl = "https://o2o.sf-express.com:443/api"; //pro

    var urlVisitor = "/scorder/visitor";
    var urlNewOrder = "/scorder/cust/new";
    var urlShopAreas = "/shop/areas";
    var urlProductType = "/shop/productTypes";
    var urlSystemDate = "/system/now";
    var urlExpectTimeOption = "/shop/expectTimeOption";

    var growlOptions = {
        type: 'info', // (null, 'info', 'danger', 'success')
        offset: {from: 'top', amount: 200}, // 'top', or 'bottom'
        align: 'center', // ('left', 'right', or 'center')
        width: 300, // (integer, or 'auto')
        delay: 3000 // Time while the message will be displayed. It's not equivalent to the *demo* timeOut!
    };

    var urlSet = {
        //async:异步请求拦截开关,reqStatus:请求状态,mask:加载loading是否显示
        "/shop/visitor": {"async": true, "reqStatus": true, "mask": false},
        "/shop/verificationCode": {"async": true, "reqStatus": true, "mask": false},
        "/scorder/cust/new": {"async": true, "reqStatus": true, "mask": false}
    };

    //请求过滤
    var reqFilter = function (url) {
        var flag = false;
        for (var key in urlSet) {
            var obj = urlSet[key];
            if (url.indexOf(key) >= 0 && obj && obj.async) {
                if (obj.reqStatus) {
                    obj.reqStatus = !obj.reqStatus;
                    urlSet[key] = obj;
                    return true;
                } else {
                    return false;
                }
            } else {
                flag = true;
            }
        }
        return flag;
    };
    //返回过滤
    var rspFilter = function (url) {
        for (var key in urlSet) {
            if (url.indexOf(key) >= 0) {
                var obj = urlSet[key];
                if (obj.async && !obj.reqStatus) {
                    obj.reqStatus = !obj.reqStatus;
                    urlSet[key] = obj;
                }
            }
        }
    };

    var getAjax = function (opts) {
        var defaults = {
            url: null,
            data: null,
            async: false,
            dataType: 'json',
            method: 'POST',
            headers: {
                'ocs-client-id': 'O2O-Business-ScWeb'
            },
            successFn: null,
            errorFn: null
        };
        var config = $.extend({}, defaults, opts);
        config.method = (config.method == null || config.method == "" || typeof(config.method) == "undefined") ? "post" : config.method;
        config.dataType = (config.dataType == null || config.dataType == "" || typeof(config.dataType) == "undefined") ? "json" : config.dataType;
        config.data = (config.data == null || config.data == "" || typeof(config.data) == "undefined") ? {"date": new Date().getTime()} : config.data;
        if (!reqFilter(config.url)) return;
        var reqUrl = serverUrl + config.url;
        $.ajax({
            method: config.method,
            async: config.async,
            data: config.data,
            url: reqUrl,
            dataType: config.dataType,
            headers: config.headers,
            success: function (d) {
                rspFilter(config.url);
                config.successFn(d);
            },
            error: function (e) {
                rspFilter(config.url);
                config.errorFn(e);
            }
        });
    };

    return {
        serverUrl: serverUrl,
        urlVisitor: urlVisitor,
        urlNewOrder: urlNewOrder,
        urlShopAreas: urlShopAreas,
        urlProductType: urlProductType,
        urlSystemDate: urlSystemDate,
        urlExpectTimeOption: urlExpectTimeOption,
        growlOptions: growlOptions,
        getAjax: getAjax
    }
})(jQuery);