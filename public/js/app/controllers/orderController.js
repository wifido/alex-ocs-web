define([
    'angular'
], function (angular) {
    'use strict';
    return angular.module('appCtrls.orderCtrls', [])
        //订单列表
        .controller('orderListCtrl', ['$scope', '$rootScope', '$state', '$cookies', '$interval', 'orderBiz', 'authBiz', 'CacheBiz', 'SystemConfig', '$ocsPopup',
            function ($scope, $rootScope, $state, $cookies, $interval, orderBiz, authBiz, CacheBiz, SystemConfig, $ocsPopup) {
                $('[data-toggle="tooltip"]').tooltip();
                //init
                $scope.totalCount = 0;//总数
                $scope.currentPage = 1;//当前页
                $scope.pageCount = 0;//页数
                $scope.pageSize = 10;//每页条数
                $scope.receiveOrder = {
                    orderNo: '',
                    receiveAddress: ''
                };
                $scope.loading = false;//数据加载标记
                //query detail
                $scope.selector = {
                    availableOptions: [
                        {id: '0', name: '全部'},
                        {id: '1', name: '完成'},
                        {id: '2', name: '异常'}
                    ],
                    selectedOption: {id: '0', name: '全部'}
                };
                $scope.query = {
                    shopCode: '',//商铺编码
                    contactMobile: '',//联系方式
                    orderStatus: '0',//订单状态 0(全部)1(完成)2(异常)
                    startDate: '',//开始时间
                    endDate: '',//结束时间
                    dateType: '',//日期范围 1-今天 2-最近7天 3-本月
                    pageIndex: 1,//当前页
                    pageSize: $scope.pageSize//页面条数
                };

                //start orderListTable
                var intervalPromise; //保存定时请求的对象,使用完之后需要进行销毁
                $scope.orderListTable = {
                    id: "orderListTable", //必须是id,通过jquery主键选择器获取
                    columns: [
                        {field: 'flag'},
                        {field: 'orderNo'},
                        {field: 'receivePhone'},
                        {field: 'receiveAddress'},
                        {field: 'paidAccount'},
                        {field: 'shopOrderDate'},
                        {field: 'vieBillDt'},
                        {field: 'takeItemDate'},
                        {field: 'signedDate'},
                        {
                            field: 'orderStatus', class: "details-control",
                            formatter: function (value, row, index) {
                                return '<a style="cursor:pointer;text-decoration:none;">' + value + '</a>';
                            }
                        }
                    ],
                    //普通行点击事件
                    clickRowCallback: function (e, row, $tr, $td) {
                        if ($td == "orderStatus") {
                            if ($tr.next().is('tr.detail-view')) {
                                $('#' + $scope.orderListTable.id).bootstrapTable('collapseRow', $tr.data('index'));
                            } else {
                                $('#' + $scope.orderListTable.id).bootstrapTable('expandRow', $tr.data('index'));
                            }
                        } else if ($td == "modifyAddress") {
                            if (row.orderErrorCode != '1') return;
                            $scope.receiveOrder.orderNo = row.orderNo;
                            $scope.receiveOrder.receiveAddress = row.receiveAddress;
                            $ocsPopup.confirm({
                                id: 'modifyAddressModal',
                                templateUrl: 'js/app/template/modifyAddress.html',
                                scope: $scope
                            }).then(function (res) {
                                if (res) {
                                    if ($scope.receiveOrder.orderNo && $scope.receiveOrder.receiveAddress) {
                                        orderBiz.modifyOrderAddress({
                                            orderNo: $scope.receiveOrder.orderNo,
                                            newAddress: $scope.receiveOrder.receiveAddress
                                        }).then(function (result) {
                                            if (result.success) {
                                                $ocsPopup.growl('修改成功,5秒后数据刷新', {type: 'success'});
                                                if (intervalPromise) {
                                                    $interval.cancel(intervalPromise);
                                                }
                                                $scope.loading = true;
                                                intervalPromise = $interval(function () {
                                                    getOrders($scope.query);
                                                }, 5000, 1);
                                            } else {
                                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                                            }
                                        }, function (errorResult) {
                                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                                        });
                                    }
                                }
                            });
                        } else if ($td == "cancelOrder") {
                            if (row.cancelType != '1') return;
                            $ocsPopup.confirm({
                                scope: $scope,
                                content: "确认取消订单?"
                            }).then(function (res) {
                                if (res) {
                                    orderBiz.cancelOrder({orderNo: row.shopOrderno}).then(function (result) {
                                        if (result.success) {
                                            $ocsPopup.growl('取消成功,5秒后数据刷新', {type: 'success'});
                                            if (intervalPromise) {
                                                $interval.cancel(intervalPromise);
                                            }
                                            $scope.loading = true;
                                            intervalPromise = $interval(function () {
                                                getOrders($scope.query);
                                            }, 5000, 1);
                                        } else {
                                            $ocsPopup.growl(result.errorInfo + ',请稍后重试', {type: 'danger'});
                                        }
                                    }, function (errorResult) {
                                        $ocsPopup.growl(errorResult.text, {type: 'danger'});
                                    });
                                }
                            });
                        }
                    },
                    //行点击扩展事件,点击详细图标展开详细页面的时触发
                    expandRowCallback: function (e, index, row, $detail) {
                        var orderNo = row.orderNo;
                        orderBiz.getOrderDetail({orderNo: orderNo}).then(
                            function (result) {
                                if (result.success) {
                                    var list = result.object;
                                    if (list == '') return;
                                    var detail = '';
                                    var len = list.length;
                                    if (len == 1) {
                                        detail = formBefore + redBefore + getOprTime(list[0]) + ' ' + list[0].orderState + ' ' + getEmpInfo(list[0]) + getErrorInfo(list[0]) + after + formAfter;
                                    } else if (len > 1) {
                                        var last = formBefore;
                                        $.each(list, function (idx, obj) {
                                            if ((idx + 1) == len) {
                                                last += redBefore + getOprTime(obj) + ' ' + obj.orderState + ' ' + getEmpInfo(obj) + getErrorInfo(obj);
                                            } else {
                                                detail = grapBefore + getOprTime(obj) + ' ' + obj.orderState + ' ' + getEmpInfo(obj) + getErrorInfo(obj) + after + detail;
                                            }
                                        });
                                        detail = last + detail;
                                        detail += formAfter;
                                    }
                                    $detail.html(detail);
                                } else {
                                    $ocsPopup.growl('获取路由详情失败', {type: 'danger'});
                                }
                            }, function (errorResult) {
                                $ocsPopup.growl('获取路由详情失败', {type: 'danger'});
                            }
                        );
                    },
                    //权限控制回调函数
                    accessControlCallback: function () {
                        //修改地址
                        if (authBiz.isButtonAccessibleForUser($cookies.get('userRole'), 'modifyAddress')) {
                            $scope.orderListTable.columns.push({
                                field: 'modifyAddress', class: "modify-operation",
                                formatter: function (value, row, index) {
                                    return (row.orderErrorCode == '1' ? true : false) ?
                                    "<span style='cursor: pointer' " +
                                    "type='button' class='text-blue'>修改</span>" :
                                        "<span type='button' class='text-dark'>不可修改</span>";
                                }
                            });
                            $('#' + $scope.orderListTable.id).find('tr').append('<th data-field="modifyAddress" data-align="center">地址修改</th>');
                        }
                        //取消订单
                        if (authBiz.isButtonAccessibleForUser($cookies.get('userRole'), 'cancelOrder')) {
                            $scope.orderListTable.columns.push({
                                field: 'cancelOrder', class: "cancel-operation",
                                formatter: function (value, row, index) {
                                    return (row.cancelType == '1' ? true : false) ?
                                    "<span style='cursor: pointer' " +
                                    "type='button' class='text-blue'>取消</span>" :
                                        "<span type='button' class='text-dark'>不可取消</span>";
                                }
                            });
                            $('#' + $scope.orderListTable.id).find('tr').append('<th data-field="cancelOrder" data-align="center">订单取消</th>');
                        }
                    },
                    templateUrl: "js/app/template/orderListTable.html" //指令模板,可自行定制,遵循bootstrap-table格式
                };
                var formBefore = '<div class="pull-right"> <ul class="timeline">';
                var formAfter = '</ul> </div>';
                var redBefore = ' <li> <i class="fa fa-o bg-red"></i> <div class="timeline-item"> <div class="timeline-body">';
                var after = '</div></div></li> ';
                var grapBefore = '<li> <i class="fa fa-o bg-gray"></i> <div class="timeline-item"> <div class="timeline-body">';
                var getOprTime = function (obj) {
                    var timeInfo = '';
                    if (obj.operateDate) {
                        timeInfo = obj.operateDate;
                    }
                    return timeInfo;
                };
                var getEmpInfo = function (obj) {
                    var empInfo = '';
                    if (obj.deliveryEmpName && obj.deliveryEmpTel) {
                        empInfo = '（配送员：' + obj.deliveryEmpName + ' ' + obj.deliveryEmpTel + '）';
                    }
                    return empInfo;
                };
                var getErrorInfo = function (obj) {
                    var errorInfo = '';
                    if (obj.exceptionReason) {
                        errorInfo = '（' + obj.exceptionReason + '）';
                    }
                    return errorInfo;
                };
                //end orderListTable

                // 查询
                $scope.startDate = ""; //选择的开始日期
                $scope.endDate = ""; // 选择的结束日期
                $scope.search = function () {
                    $scope.query.pageIndex = 1;
                    $scope.currentPage = 1;
                    $scope.query.orderStatus = $scope.selector.selectedOption.id;
                    if ($scope.startDate && !$scope.endDate) {
                        $ocsPopup.growl('请输入结束时间', {type: 'danger'});
                        return;
                    }
                    if (!$scope.startDate && $scope.endDate) {
                        $ocsPopup.growl('请输入开始时间', {type: 'danger'});
                        return;
                    }
                    if ($scope.startDate) {
                        $scope.query.startDate = $scope.startDate.getTime();
                        $scope.currentPage = 1;
                    }
                    if ($scope.endDate) {
                        $scope.query.endDate = $scope.endDate.getTime() + 24 * 60 * 60 * 1000;
                        $scope.currentPage = 1;
                    }
                    if ($scope.query.startDate && $scope.query.endDate && $scope.query.startDate >= $scope.query.endDate) {
                        $ocsPopup.growl('开始时间不可大于结束时间', {type: 'danger'});
                        return;
                    }
                    getOrders($scope.query);
                };
                //重置
                // $scope.reset = function () {
                //     $scope.query.contactMobile = '';
                //     $scope.query.startDate = '';
                //     $scope.query.endDate = '';
                //     $scope.startDate = '';
                //     $scope.endDate = '';
                //     $scope.query.dateType = '';
                //     $scope.query.pageIndex = 1;
                //     $scope.query.pageSize = $scope.pageSize;
                // };
                // 打印
                $scope.print = function () {
                    var nodes = $('#' + $scope.orderListTable.id).bootstrapTable('getAllSelections');
                    var checkedOrders = []; //选中的订单(需要从后台获取)
                    var orderNos = [];
                    $.each(nodes, function (index, element) {
                        orderNos.push(nodes[index].orderNo);
                    });
                    if (orderNos.length <= 0) {
                        $ocsPopup.growl("请选择订单", {type: 'danger'});
                        return;
                    }
                    // if (orderNos.length > 5) {
                    //     $ocsPopup.growl("一次最多打印5张", {type: 'danger'});
                    //     return;
                    // }
                    orderBiz.getPrintOrderList({orderNos: orderNos.toString()}).then(function (result) {
                        if (result.success) {
                            checkedOrders = result.object;
                            if (checkedOrders.length <= 0) {
                                $ocsPopup.growl("数据出错", {type: 'danger'});
                                return;
                            }
                            for (var i = 0; i < checkedOrders.length; i++) {
                                if ($cookies.get('authUser')) {
                                    //添加商家地址
                                    checkedOrders[i].shopAddress = angular.fromJson($cookies.get('authUser')).shopAddress;
                                } else {
                                    $ocsPopup.growl("用户过期,请重新登陆", {type: 'danger'});
                                    return;
                                }
                            }
                            CacheBiz.setCache(SystemConfig.orderInfo, checkedOrders);
                            //跳转至打印页面
                            window.open(SystemConfig.url_print);
                        } else {
                            $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                        }
                    }, function (errorResult) {
                        $ocsPopup.growl(errorResult.text, {type: 'danger'});
                    });
                };
                // 下一页
                $scope.next = function () {
                    if ($scope.loading) {
                        return;
                    }
                    if ($scope.orderList.length == 0) {
                        $ocsPopup.growl('请先查询', {type: 'danger'});
                        return;
                    }
                    if ($scope.currentPage == $scope.pageCount) {
                        $ocsPopup.growl('已经是最后一页', {type: 'info'});
                        return;
                    }
                    $scope.currentPage++;
                    $scope.query.pageIndex = $scope.currentPage;
                    getOrders($scope.query);
                };
                // 上一页
                $scope.previous = function () {
                    if ($scope.loading) {
                        return;
                    }
                    if ($scope.orderList.length == 0) {
                        $ocsPopup.growl('请先查询', {type: 'danger'});
                        return;
                    }
                    if ($scope.currentPage == 1) {
                        $ocsPopup.growl('已经是第一页', {type: 'info'});
                        return;
                    }
                    $scope.currentPage--;
                    $scope.query.pageIndex = $scope.currentPage;
                    getOrders($scope.query);
                };
                // 第一页
                $scope.first = function () {
                    if ($scope.loading) {
                        return;
                    }
                    if ($scope.orderList.length == 0) {
                        $ocsPopup.growl('请先查询', {type: 'danger'});
                        return;
                    }
                    if ($scope.currentPage == 1) {
                        $ocsPopup.growl('已经是第一页', {type: 'info'});
                        return;
                    }
                    $scope.currentPage = 1;
                    $scope.query.pageIndex = $scope.currentPage;
                    getOrders($scope.query);
                };
                // 最后一页
                $scope.last = function () {
                    if ($scope.loading) {
                        return;
                    }
                    if ($scope.orderList.length == 0) {
                        $ocsPopup.growl('请先查询', {type: 'danger'});
                        return;
                    }
                    if ($scope.currentPage == $scope.pageCount) {
                        $ocsPopup.growl('已经是最后一页', {type: 'info'});
                        return;
                    }
                    $scope.currentPage = $scope.pageCount;
                    $scope.query.pageIndex = $scope.currentPage;
                    getOrders($scope.query);
                };
                $scope.orderList = []; // 存储当页的订单列表
                var getOrders = function (condition) {
                    $scope.loading = true;
                    $ocsPopup.showLoading(true, $('#' + $scope.orderListTable.id));
                    orderBiz.getOrderList(condition).then(
                        function (result) {
                            $scope.loading = false;
                            $ocsPopup.showLoading(false, $('#' + $scope.orderListTable.id));
                            if (result.success) {
                                $scope.totalCount = result.object.totalCount;
                                if ($scope.totalCount == 0) {
                                    $scope.pageCount = 0;
                                }
                                if (!$scope.totalCount) {
                                    $scope.totalCount = 0;
                                    $scope.pageCount = 0;
                                } else {
                                    $scope.pageCount = Math.ceil($scope.totalCount / $scope.pageSize)
                                }
                                // 保存当页订单列表数据
                                $scope.orderList.length = 0;
                                for (var i = 0; i < result.object.orderInfoList.length; i++) {
                                    $scope.orderList.push(result.object.orderInfoList[i]);
                                }
                                $('#' + $scope.orderListTable.id).bootstrapTable('load', {
                                    data: result.object.orderInfoList
                                });
                            } else {
                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                            }
                        }, function (errorResult) {
                            $scope.loading = false;
                            $ocsPopup.showLoading(false, $('#' + $scope.orderListTable.id));
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                        }
                    );
                }; // getOrders end
                $scope.query.dateType = '';
                // $scope.today = function () {
                //     if ($scope.query.dateType != '1') {
                //         $scope.query.dateType = 1;
                //         $("#todayBtn").css("background-color", "#3c8dbc").css("color", "white");
                //         $("#weekBtn").css("background-color", "").css("color", "black");
                //         $("#monthBtn").css("background-color", "").css("color", "black");
                //         $("#startDate").val("");
                //         $("#endDate").val("");
                //         $("#startDate").attr("disabled", "disabled");
                //         $("#endDate").attr("disabled", "disabled");
                //     } else {
                //         $scope.query.dateType = '';
                //         $("#todayBtn").css("background-color", "").css("color", "black");
                //         $("#startDate").removeAttr("disabled");
                //         $("#endDate").removeAttr("disabled");
                //     }
                // };
                // $scope.week = function () {
                //     if ($scope.query.dateType != '2') {
                //         $scope.query.dateType = 2;
                //         $("#weekBtn").css("background-color", "#3c8dbc").css("color", "white");
                //         $("#todayBtn").css("background-color", "").css("color", "black");
                //         $("#monthBtn").css("background-color", "").css("color", "black");
                //         $("#startDate").val("");
                //         $("#endDate").val("");
                //         $("#startDate").attr("disabled", "disabled");
                //         $("#endDate").attr("disabled", "disabled");
                //     } else {
                //         $scope.query.dateType = '';
                //         $("#weekBtn").css("background-color", "").css("color", "black");
                //         $("#startDate").removeAttr("disabled");
                //         $("#endDate").removeAttr("disabled");
                //     }
                // };
                // $scope.month = function () {
                //     if ($scope.query.dateType != '3') {
                //         $scope.query.dateType = 3;
                //         $("#monthBtn").css("background-color", "#3c8dbc").css("color", "white");
                //         $("#todayBtn").css("background-color", "").css("color", "black");
                //         $("#weekBtn").css("background-color", "").css("color", "black");
                //         $("#startDate").val("");
                //         $("#endDate").val("");
                //         $("#startDate").attr("disabled", "disabled");
                //         $("#endDate").attr("disabled", "disabled");
                //     } else {
                //         $scope.query.dateType = '';
                //         $("#monthBtn").css("background-color", "").css("color", "black");
                //         $("#startDate").removeAttr("disabled");
                //         $("#endDate").removeAttr("disabled");
                //     }
                // };
            }
        ])
        //下单
        .controller('orderCreateCtrl', ['$rootScope', '$scope', '$state', 'orderBiz', '$ocsPopup', '$cookies', 'SystemConfig', 'shopBiz',
            function ($rootScope, $scope, $state, orderBiz, $ocsPopup, $cookies, SystemConfig, shopBiz) {
                $scope.city = $rootScope.authUser.cityName;
                $scope.genOrderNo = $rootScope.authUser.shopCode + new Date().getTime();
                /*{id: '1', name: '送药'},
                 {id: '2', name: '送餐'},
                 {id: '3', name: '百货'},
                 {id: '4', name: '脏衣收'},
                 {id: '5', name: '干净衣派'},
                 {id: '6', name: '生鲜'}*/
                //商品类别
                $scope.selector = {
                    availableOptions: [],
                    selectedOption: {}
                };
                //区信息
                $scope.areaSelector = {
                    availableOptions: [],
                    selectedOption: {}
                };
                $scope.templateDownload = SystemConfig.url_template_download; //模板下载链接
                $scope.query = {
                    orderNo: '',//订单号
                    areaName: '',//区名
                    contactMobile: '',//联系方式
                    contactPerson: '',//收货人
                    contactAddress: '',//详细地址
                    orderAmount: 0,//代收金额
                    payMethod: '1',//支付方式
                    payStatus: 1,//付款状态 1-已付款 2-未付款
                    productCategary: '',//商品类型
                    productCategaryName: '',//商品名称
                    productNum: 1,//数量
                    weight: 0,//重量
                    remark: ''//备注
                };
                //商品数量监控
                $scope.$watch('query.productNum', function (newValue, oldValue, scope) {
                    if (newValue <= 0) {
                        $ocsPopup.growl('商品数量不能小于1', {type: 'danger', delay: 1000});
                        scope.query.productNum = 1;
                    }
                });
                //数据初始化
                $scope.initData = function () {
                    //获取区信息
                    shopBiz.shopAreas({cityCode: $rootScope.authUser.cityCode}).then(function (result) {
                        if (result.success && result.object.length > 0) {
                            var areas = [];
                            for (var i = 0; i < result.object.length; i++) {
                                areas.push({id: i + 1, name: result.object[i]});
                            }
                            for (i = 0; i < areas.length; i++) {
                                if (areas[i].name == $rootScope.authUser.areaName) {
                                    $scope.areaSelector.selectedOption = areas[i];
                                    break;
                                }
                            }
                            $scope.areaSelector.availableOptions = areas;
                        } else {
                            $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                        }
                    }, function (errorResult) {
                        $ocsPopup.growl(errorResult.text, {type: 'danger'});
                    });
                    //可选商品类别列表
                    shopBiz.shopProductType({storeCode: $rootScope.authUser.shopCode}).then(function (result) {
                        if (result.success && result.object.length > 0) {
                            $scope.selector.availableOptions = result.object;
                            $scope.selector.selectedOption = result.object[0];
                        } else if (result.object.length == 0) {
                            $ocsPopup.growl("该商家没有商品类别", {type: 'danger'});
                        } else {
                            $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                        }
                    }, function (errorResult) {
                        $ocsPopup.growl(errorResult.text, {type: 'danger'});
                    });
                };
                //已付款
                $scope.payed = function () {
                    $scope.query.payStatus = 1;
                    $("#payedBtn").css("background-color", "#3c8dbc").css("color", "white");
                    $("#nopayBtn").css("background-color", "").css("color", "black");
                    $("#codFee").val("0");
                    $("#codFee").attr("disabled", "disabled");
                };
                //未付款
                $scope.nopay = function () {
                    $scope.query.payStatus = 2;
                    $("#payedBtn").css("background-color", "").css("color", "black");
                    $("#nopayBtn").css("background-color", "#3c8dbc").css("color", "white");
                    $("#codFee").removeAttr("disabled");
                };
                //录入
                $scope.inputNo = function () {
                    $scope.genOrderNo = '';
                    $("#orderNo")[0].focus();
                };
                $scope.payed();//init
                $scope.createOrder = function () {
                    if (!$scope.genOrderNo) {
                        $ocsPopup.growl('请输入订单号', {type: 'danger'});
                        $("#orderNo")[0].focus();
                        return;
                    }
                    if (!$scope.query.contactMobile) {
                        $ocsPopup.growl('请输入联系方式', {type: 'danger'});
                        $("#telephone")[0].focus();
                        return;
                    }
                    var mobileRe = /^1[3|4|5|7|8]\d{9}$/;
                    var telRe = /^\d{7,8}$/;
                    var telLen = $scope.query.contactMobile.length;
                    if (telLen != 7 && telLen != 8 && telLen != 11) {
                        $ocsPopup.growl('请输入正确的手机号码或电话', {type: 'danger'});
                        $("#telephone")[0].focus();
                        return;
                    }
                    if (telLen == 11 && !mobileRe.test($scope.query.contactMobile)) {
                        $ocsPopup.growl('请输入正确的手机号码', {type: 'danger'});
                        $("#telephone")[0].focus();
                        return;
                    }
                    if ((telLen == 7 || telLen == 8) && !telRe.test($scope.query.contactMobile)) {
                        $ocsPopup.growl('请输入正确的电话号码', {type: 'danger'});
                        $("#telephone")[0].focus();
                        return;
                    }
                    if (!$scope.query.contactPerson) {
                        $ocsPopup.growl('请输入收货人', {type: 'danger'});
                        $("#linkman")[0].focus();
                        return;
                    }
                    if (!$scope.query.contactAddress) {
                        $ocsPopup.growl('请输入详细地址', {type: 'danger'});
                        $("#contactAddress")[0].focus();
                        return;
                    }
                    if ($scope.query.payStatus == 2 && $scope.query.orderAmount == 0) {
                        $ocsPopup.growl('请输入代收金额', {type: 'danger'});
                        $("#codFee")[0].focus();
                        return;
                    }
                    re = /^\d+(?=\.{0,1}\d+$|$)/;
                    if ($scope.query.payStatus == 2 && !re.test($scope.query.orderAmount)) {
                        $ocsPopup.growl('请输入正确的金额数', {type: 'danger'});
                        $("#codFee")[0].focus();
                        return;
                    }
                    var re = /^[0-9]*[1-9][0-9]*$/;
                    if (!re.test($scope.query.productNum)) {
                        $ocsPopup.growl('请输入正确的数量', {type: 'danger'});
                        $("#quantity")[0].focus();
                        return;
                    }
                    if (!$scope.query.weight) {
                        $scope.query.weight = 0;
                    }
                    re = /^\d+(?=\.{0,1}\d+$|$)/;
                    if ($scope.query.weight != 0 && $scope.query.weight != '0' && !re.test($scope.query.weight)) {
                        $ocsPopup.growl('请输入正确的重量', {type: 'danger'});
                        $("#weight")[0].focus();
                        $scope.query.weight = 0;
                        return;
                    }
                    $scope.query.orderNo = $scope.genOrderNo;
                    $scope.query.productCategary = $scope.selector.selectedOption.type;
                    $scope.query.productCategaryName = $scope.selector.selectedOption.name;
                    $scope.query.areaName = $scope.areaSelector.selectedOption.name;
                    orderBiz.createOrder($scope.query).then(
                        function (result) {
                            if (result.success) {
                                $scope.resetData();
                                $ocsPopup.growl('下单成功', {type: 'success'});
                            } else {
                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                            }
                            $scope.genOrderNo = $rootScope.authUser.shopCode + new Date().getTime();
                        },
                        function (errorResult) {
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                            $scope.genOrderNo = $rootScope.authUser.shopCode + new Date().getTime();
                        }
                    );
                };
                $scope.resetData = function () {
                    $scope.query.contactAddress = '';
                    $scope.query.contactMobile = '';
                    $scope.query.contactPerson = '';
                    $scope.query.weight = 0;
                    $scope.query.remark = '';
                    $scope.query.orderAmount = 0;
                    $scope.payed();
                    $scope.query.productNum = 1;
                    $scope.genOrderNo = $rootScope.authUser.shopCode + new Date().getTime();
                };

                //文件上传
                $scope.disable = false; //标识上传按钮是否可点击
                $scope.percent = "0%";
                $scope.upload = function (file) {
                    if (file != null) {
                        $scope.disable = true;
                        var fd = new FormData();
                        fd.append('file', file);
                        orderBiz.batchPlaceOrder(fd).then(function (result) {
                            //成功返回
                            if (result.success) {
                                $ocsPopup.growl('批量导单成功! 成功:' + result.object.successNum + '单,失败:' + result.object.failNum + '单', {
                                    type: 'success',
                                    delay: 3000
                                });
                            } else {
                                if (result.object) {
                                    $scope.batchResult = result.object;
                                    $scope.successNum = $scope.batchResult.successNum;
                                    $scope.failNum = $scope.batchResult.failNum;
                                    $scope.failList = $scope.batchResult.failList;
                                    $ocsPopup.showModal({
                                        id: 'batchOrderResultModal',
                                        templateUrl: 'js/app/template/batchOrderResultModal.html',
                                        scope: $scope
                                    }).then(function (res) {
                                        if (res) {
                                            $('#batchOrderResultTable').bootstrapTable({
                                                data: $scope.failList
                                            });
                                        }
                                    });
                                } else {
                                    $ocsPopup.growl(result.errorInfo ? result.errorInfo : "上传失败,请检查格式", {type: 'danger'});
                                }
                            }
                            $scope.disable = false;
                            $scope.percent = "0%";
                            $scope.file = null;
                        }, function (errorResult) {
                            $scope.file = null;
                            $scope.disable = false;
                            $scope.percent = "0%";
                            $ocsPopup.growl("上传失败", {type: 'danger'});
                        }, function (evt) {
                            $scope.percent = parseInt(100.0 * evt.loaded / evt.total) + "%";
                        });
                    } else {
                        $ocsPopup.growl("请选择上传的xls文件", {type: 'danger'});
                    }
                };
            }
        ])
});
