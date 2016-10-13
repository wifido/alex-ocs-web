/**
 * Created by Alexqiqing on 16/9/21.
 */
$(function () {
    $('html,body').animate({scrollTop: '0px'}, 300);
    var reqCount = 1; //验证码请求次数
    var maxCount = 10; //验证码最大请求次数
    var shopInfo = null; //商家/店铺信息

    //初始化数据
    function initData(data) {
        //首次获取验证码
        $("#captchaImage").attr("src", systemConfig.serverUrl + "/captcha/getScOrderCaptcha?visitorToken=" + shopInfo.token + "&timestamp=" + Math.random());
        //取件地址
        $('#shopAddress').val(data.shopAddress + "(商家/店铺:" + data.shopName + ")");
        //市信息
        $('#cities').find("option[value='1']").text(data.cityName);
        //获取区信息
        getAreas(data);
        //可选商品类别列表
        getProductTypes(data);
        //获取商家期望时间列表
        getExpectTimeOption(data);
        //期望送达时间初始化 从服务器获取当前时间
        getExpectTimeOption(data);
        // changeTimeType();
    }

    //从url截取请求参数
    function UrlSearch() {
        var name, value;
        var str = window.location.href; //取得整个地址栏
        var num = str.indexOf("?");
        str = str.substr(num + 1); //取得所有参数
        var arr = str.split("&"); //各个参数放到数组里
        for (var i = 0; i < arr.length; i++) {
            num = arr[i].indexOf("=");
            if (num > 0) {
                name = arr[i].substring(0, num);
                value = arr[i].substr(num + 1);
                this[name] = value;
            }
        }
    }

    //验证进入页面时的请求数据
    function validateReqData(data) {
        var count = 0;
        for (var key in data) {
            switch (key) {
                case 'shopCode':
                    count++;
                    break;
                case 'clientCode':
                    count++;
                    break;
                case 'parentShopCode':
                    count++;
                    break;
                default :
                    count--;
                    break;
            }
        }
        if (count != 3) return null;
        return data;
    }

    var reqData = new UrlSearch();

    var data = validateReqData(reqData);

    if (data) {
        getShopVisitor(data);//获取商家/店铺信息
    }

    //下单
    $('#createOrder').click(function () {
        var receiveContacts = $('#receiveContacts').val();//收件联系人
        var receiveMobile = $('#receiveMobile').val();//收件联系方式
        var receiveAreaName = $('#areas option:selected').text();//收件地址所在区
        var receiveAddress = $('#receiveAddress').val();//详细地址
        var expectDate = $('#expectDate').val(); //期望时间
        // var expectSelectedOptionText = $('#expectDate option:selected').text();
        // var timeType = $('#timeType').val(); //默认选择"今天"
        // if (expectSelectedOptionText
        //     && expectSelectedOptionText.split(":").length == 2) {
        //     expectDate = getFormatDate(timeType) + " " + expectSelectedOptionText + ":00";
        // }
        var productCategary = $('#productTypes option:selected').val();//商品类别类型
        var productCategaryName = $('#productTypes option:selected').text();//商品类别名
        var shopOrderNo = $('#shopOrderNo').val();//商家订单号
        var machineNo = $('#machineNo').val();//机号
        var captcha = $('#captcha').val();//验证码
        var pickupMobile = $('#pickupMobile').val();//取货寄件联系人电话
        var shopAddress = $('#shopAddress').val();//取货地址(商家/店铺地址)

        var errorMsg = "还有信息未填写,请检查";
        var pass = true;
        if (!receiveContacts) {
            $('#receiveContacts').focus();
            errorMsg = "请输入收件联系人";
            plugin.bootstrapAlert(errorMsg, {appendTo: 'receiveContacts'});
            pass = false;
        } else if (!reg(4, receiveMobile)) {
            $('#receiveMobile').focus();
            errorMsg = "请输入收件人正确手机或固话";
            plugin.bootstrapAlert(errorMsg, {appendTo: 'receiveMobile'});
            pass = false;
        } else if (!receiveAddress) {
            $('#receiveAddress').focus();
            errorMsg = "请输入收件人详细地址";
            plugin.bootstrapAlert(errorMsg, {appendTo: 'receiveAddress'});
            pass = false;
        } else if (!reg(6, shopOrderNo)) {
            $('#shopOrderNo').focus();
            errorMsg = "商家订单号只能是字母和数字";
            plugin.bootstrapAlert(errorMsg, {appendTo: 'shopOrderNo'});
            pass = false;
        } else if (!reg(6, machineNo)) {
            $('#machineNo').focus();
            errorMsg = "机号只能是字母和数字";
            plugin.bootstrapAlert(errorMsg, {appendTo: 'machineNo'});
            pass = false;
        } else if (!captcha) {
            $('#captcha').focus();
            errorMsg = "验证码不能为空";
            plugin.bootstrapAlert(errorMsg, {appendTo: 'captcha'});
            pass = false;
        } else if (!reg(3, pickupMobile)) {
            $('#pickupMobile').focus();
            errorMsg = "请输入寄件人正确手机";
            plugin.bootstrapAlert(errorMsg, {appendTo: 'pickupMobile'});
            pass = false;
        }
        if (!pass) {
            // plugin.bootstrapGrowl(errorMsg, {type: 'danger', delay: 3000, offset: {from: 'top', amount: 100}});
            return;
        }
        var newOrderReq = {
            shopOrderNo: shopOrderNo,
            machineNo: machineNo,
            shopCode: shopInfo.shopCode,
            receiveContacts: receiveContacts,
            receiveMobile: receiveMobile,
            receiveAreaName: receiveAreaName,
            receiveAddress: receiveAddress,
            expectDate: expectDate,
            productCategary: productCategary,
            productCategaryName: productCategaryName,
            weight: 0,
            pickupMobile: pickupMobile,
            shopAreaName: shopInfo.areaName,
            shopAddress: shopAddress,
            provinceName: shopInfo.provinceName,
            cityName: shopInfo.cityName
        };
        newOrder(newOrderReq);//确认下单
    });

    //收件人联系方式输入完成"失去焦点"事件
    $('#receiveMobile').blur(function () {
        if (reg(4, $(this).val())) {
            $('#pickupMobile').val($(this).val());
        } else {
            $('#pickupMobile').val("");
        }
    });

    //下单成功弹出框"确定"点击事件
    $('#btn_ok').click(function () {
        window.location.reload();
    });

    //获取验证码
    $('#captchaImage').click(function () {
        reqCount++;
        if (reqCount > maxCount) {
            plugin.bootstrapGrowl('验证码刷新太频繁,为保证验证码不失效,请重新刷新页面', {type: 'danger'});
            return;
        }
        $("#captchaImage").attr("src", systemConfig.serverUrl + "/captcha/getScOrderCaptcha?visitorToken=" + shopInfo.token + "&timestamp=" + Math.random());
    });

    //切换时间类型 今天 明天
    // $('#timeType').change(changeTimeType);

    //获取商家/店铺信息
    function getShopVisitor(data) {
        var opts = {
            url: systemConfig.urlVisitor,
            data: data,
            async: false,
            dataType: 'json',
            method: 'POST',
            successFn: function (result) {
                if (result.success) {
                    shopInfo = result.object;
                    initData(shopInfo);
                } else {
                    plugin.bootstrapGrowl(result.errorInfo, {type: 'danger'});
                }
            },
            errorFn: function (errorResult) {
                plugin.bootstrapGrowl('网络异常', {type: 'danger'});
            }
        };
        systemConfig.getAjax(opts);
    }

    //下单
    function newOrder(data) {
        var opts = {
            url: systemConfig.urlNewOrder,
            data: data,
            async: false,
            dataType: 'json',
            method: 'POST',
            headers: {
                'ocs-client-id': 'O2O-Business-ScWeb',
                'Captha-hearder-scorder': $('#captcha').val(),
                'Token-hearder-scorder': shopInfo.token
            },
            successFn: function (result) {
                if (result.success) {
                    $('#modalBody').text('订单号为' + data.shopOrderNo + '，订单已提交成功！');
                    $('#createOrder').attr('data-target', '#myModal'); //显示模态框
                    setTimeout('window.location.reload()', 3000);
                } else {
                    plugin.bootstrapGrowl(result.errorInfo, {type: 'danger'});
                }
                $("#captchaImage").attr("src", systemConfig.serverUrl + "/captcha/getScOrderCaptcha?visitorToken=" + shopInfo.token + "&timestamp=" + Math.random());//刷新验证码
                $('#captcha').val("");//清空验证码
            },
            errorFn: function (errorResult) {
                plugin.bootstrapGrowl('网络异常', {type: 'danger'});
            }
        };
        systemConfig.getAjax(opts);
    }

    //获取区信息
    function getAreas(data) {
        var opts = {
            url: systemConfig.urlShopAreas,
            data: {cityCode: data.cityCode},
            async: true,
            dataType: 'json',
            method: 'POST',
            successFn: function (result) {
                if (result.success && result.object.length > 0) {
                    $('#areas').empty();
                    for (var i = 0; i < result.object.length; i++) {
                        $('#areas').append("<option value='" + (i + 1) + "'>" + result.object[i] + "</option>");
                        if (result.object[i] == data.areaName) {
                            var selectObj = "option[value='" + (i + 1) + "']";
                            $('#areas').find(selectObj).attr("selected", true);
                        }
                    }
                } else {
                    plugin.bootstrapGrowl(result.errorInfo, {type: 'danger'});
                }
            },
            errorFn: function (errorResult) {
                plugin.bootstrapGrowl('网络异常', {type: 'danger'});
            }
        };
        systemConfig.getAjax(opts);
    }

    //获取商品类别
    function getProductTypes(data) {
        var opts = {
            url: systemConfig.urlProductType,
            data: {storeCode: data.shopCode},
            async: true,
            dataType: 'json',
            method: 'POST',
            successFn: function (result) {
                if (result.success && result.object.length > 0) {
                    $('#productTypes').empty();
                    for (var i = 0; i < result.object.length; i++) {
                        $('#productTypes').append("<option value='" + result.object[i].type + "'>" + result.object[i].name + "</option>");
                        if (result.object[i].type == '3') { //百货
                            var selectObj = "option[value='" + result.object[i].type + "']";
                            $('#productTypes').find(selectObj).attr("selected", true);
                        }
                    }
                } else if (!result.object || result.object.length == 0) {
                    plugin.bootstrapGrowl("该商家没有商品类别", {type: 'danger'});
                } else {
                    plugin.bootstrapGrowl(result.errorInfo, {type: 'danger'});
                }
            },
            errorFn: function (errorResult) {
                plugin.bootstrapGrowl('网络异常', {type: 'danger'});
            }
        };
        systemConfig.getAjax(opts);
    }

    function getExpectTimeOption(data) {
        var opts = {
            url: systemConfig.urlExpectTimeOption,
            data: {shopCode: data.shopCode},
            async: true,
            dataType: 'json',
            method: 'POST',
            successFn: function (result) {
                if (result.success && result.object.length > 0) {
                    var selectObj = $('#expectDate');
                    selectObj.empty();
                    for (var i = 0; i < result.object.length; i++) {
                        selectObj.append("<option value='" + result.object[i].id + "'>" + result.object[i].name + "</option>");
                    }
                    selectObj.find("option[value='" + result.object[0].id + "']").attr("selected", true);
                } else {
                    plugin.bootstrapGrowl(result.errorInfo, {type: 'danger'});
                }
            },
            errorFn: function (errorResult) {
                plugin.bootstrapGrowl('网络异常', {type: 'danger'});
            }
        };
        systemConfig.getAjax(opts);
    }

    function buildDropMenu(hour, min, type) {
        var count = 1;
        var selectObj = $('#expectDate');
        selectObj.empty();
        if (type == 0) {
            selectObj.append("<option value='0'>" + "立即配送" + "</option>");
            selectObj.find("option[value='0']").attr("selected", true);
        } else {
            selectObj.append("<option value='0'>" + "00:00" + "</option>");
            selectObj.find("option[value='0']").attr("selected", true);
        }
        while (hour < 24) {
            if (min <= 30) {
                var text = hour < 10 ? '0' + hour : hour;
                selectObj.append("<option value='" + (count++) + "'>" + text + ":30" + "</option>");
            }
            if (hour != 23) {
                var text = (hour + 1) < 10 ? '0' + (hour + 1) : hour + 1;
                selectObj.append("<option value='" + (count++) + "'>" + text + ":00" + "</option>");
            }
            min = 0;
            hour++;
        }
    }

    //期望送达时间选择
    function changeTimeType() {
        // var item = $('#timeType').children('option:selected');
        //默认选择'今天'
        var item = $('#timeType');
        if (item.val() == 0) {
            //从服务器获取当前时间
            var nowDate = new Date();
            var opts = {
                url: systemConfig.urlSystemDate,
                data: '',
                async: true,
                dataType: 'json',
                method: 'POST',
                successFn: function (result) {
                    nowDate = new Date(result.object);
                    buildDropMenu(nowDate.getHours() + 1, new Date().getMinutes(), item.val());
                },
                errorFn: function (errorResult) {
                    buildDropMenu(nowDate.getHours() + 1, new Date().getMinutes(), item.val());
                }
            };
            systemConfig.getAjax(opts);
        } else if (item.val() == 1) {
            buildDropMenu(0, 0, item.val());
        }
    }

    function getFormatDate(day) {//0-今天，1-明天，-1-昨天
        var date = new Date();
        var month = date.getMonth() + 1;
        var strDate = date.getDate() + parseInt(day);
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        return date.getFullYear() + '-' + month + '-' + strDate;
    }

    function reg(type, value) {
        var flag = false;
        var regBox = {
            regEmail: /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/,//邮箱
            regName: /^[a-z0-9_-]{3,16}$/,//用户名
            regMobile: /^0?1[3|4|5|8][0-9]\d{8}$/,//手机
            regTel: /^0?1[3|4|5|7|8][0-9]\d{8}$|^[\d]{7,8}$/,//手机或固话(无区号) 0[\d]{2,3}
            reDigit: /^\d+(\.\d+)?$/, //数字
            reDigitAndLetter: /^[0-9a-zA-Z]*$/g //数字和字母
        };
        switch (type) {
            case 1 : //邮箱
                flag = regBox.regEmail.test(value);
                break;
            case 2 : //用户名
                flag = regBox.regName.test(value);
                break;
            case 3 : //手机
                flag = regBox.regMobile.test(value);
                break;
            case 4 : //手机或固话
                flag = regBox.regTel.test(value);
                break;
            case 5: //数字与小数点
                flag = regBox.reDigit.test(value);
                break;
            case 6: //数字和字母
                flag = regBox.reDigitAndLetter.test(value);
                break;
        }
        return flag;
    }

});