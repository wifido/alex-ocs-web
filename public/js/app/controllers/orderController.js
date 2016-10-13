define([
    'angular'
], function (angular) {
    'use strict';
    return angular.module('appCtrls.orderCtrls', [])
        //订单列表
        .controller('orderListCtrl', ['$scope', '$rootScope', '$state', '$cookies', '$interval', 'orderBiz', 'authBiz', 'CacheBiz', 'SystemConfig', '$ocsPopup', 'FileSaver', 'Blob',
            function ($scope, $rootScope, $state, $cookies, $interval, orderBiz, authBiz, CacheBiz, SystemConfig, $ocsPopup, FileSaver, Blob) {
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
                $scope.startDate = new Date();
                $scope.endDate = new Date();
                //query detail
                $scope.selector = {
                    availableOptions: [
                        {id: '0', name: '全部'},
                        {id: '1', name: '完成'},
                        {id: '2', name: '异常'}
                    ],
                    selectedOption: {id: '0', name: '全部'}
                };
                $scope.printStatusSelector = {
                    availableOptions: [
                        {id: '0', name: '全部'},
                        {id: '1', name: '待打印'},
                        {id: '2', name: '已打印'}
                    ],
                    selectedOption: {id: '0', name: '全部'}
                };
                $scope.query = {
                    shopCode: '',//商铺编码
                    contactMobile: '',//联系方式
                    orderStatus: '0',//订单状态 0(全部)1(完成)2(异常)
                    printStatus: '',//打印状态 0(全部)1(待打印)2(已打印)
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
                        },
                        {
                            field: 'printFlag', class: "details-control",
                            formatter: function (value, row, index) {
                                return (row.printCount && row.printCount >= 1 ? true : false) ?
                                    "<span type='text' class='text-red'>已打印</span>" :
                                    "<span type='text' class='text-dark'>待打印</span>";
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
                                            $ocsPopup.growl(result.errorInfo, {type: 'danger'});
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
                                    var html = "";
                                    if (row.cancelType == '1') {
                                        html = "<span style='cursor: pointer' " +
                                        "type='button' class='text-blue'>取消</span>";
                                    } else {
                                        html = "<span type='button' class='text-dark'>不可取消</span>";
                                        if (row.orderStatus == '已取消') {
                                            html = "<span type='button' class='text-dark'>已取消</span>";
                                        }
                                    }
                                    return html;
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
                //$scope.startDate = ""; //选择的开始日期
                //$scope.endDate = ""; // 选择的结束日期
                $scope.search = function () {
                    $scope.query.pageIndex = 1;
                    $scope.currentPage = 1;
                    $scope.query.orderStatus = $scope.selector.selectedOption.id;
                    $scope.query.printStatus = $scope.printStatusSelector.selectedOption.id;
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
                            CacheBiz.setCacheToSession(SystemConfig.orderInfo, checkedOrders);
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
                // 导出
                $scope.export = function () {
                    $scope.query.orderStatus = $scope.selector.selectedOption.id;
                    if (!$scope.startDate && !$scope.endDate) {
                        $ocsPopup.growl('导出请输入下单日期范围', {type: 'danger'});
                        return;
                    }
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
                    }
                    if ($scope.endDate) {
                        $scope.query.endDate = $scope.endDate.getTime() + 24 * 60 * 60 * 1000;
                    }
                    if ($scope.query.startDate && $scope.query.endDate && $scope.query.startDate >= $scope.query.endDate) {
                        $ocsPopup.growl('开始时间不可大于结束时间', {type: 'danger'});
                        return;
                    }
                    var expireDate = new Date($scope.startDate);
                    expireDate.setDate(expireDate.getDate() + 31);
                    if (expireDate < $scope.endDate) {
                        $ocsPopup.growl('日期范围超过一个月，请缩短日期范围进行导出', {type: 'danger'});
                        return;
                    }
                    $scope.loading = true;
                    $ocsPopup.showLoading(true, $('#' + $scope.orderListTable.id));
                    orderBiz.exportOrders($scope.query).then(
                        function (result) {
                            $scope.loading = false;
                            $ocsPopup.showLoading(false, $('#' + $scope.orderListTable.id));
                            if (result) {
                                var blob = new Blob([result], {type: "application/x-xls"});
                                //var objectUrl = URL.createObjectURL(blob);
                                //window.open(objectUrl);
                                FileSaver.saveAs(blob, '订单列表.xls');
                            }
                        }, function (errorResult) {
                            $scope.loading = false;
                            $ocsPopup.showLoading(false, $('#' + $scope.orderListTable.id));
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                        }
                    );
                };

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
        .controller('orderCreateCtrl', ['$rootScope', '$scope', '$state', 'orderBiz', '$ocsPopup', '$cookies', 'SystemConfig', 'shopBiz', 'CacheBiz', 'ValidateBiz',
            function ($rootScope, $scope, $state, orderBiz, $ocsPopup, $cookies, SystemConfig, shopBiz, CacheBiz, ValidateBiz) {
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
                // 期望送达时间 今天 or 明天
                $scope.timeTypeSelector = {
                    availableOptions: [{name: '今天', id: 0}, {name: '明天', id: 1}],
                    selectedOption: {name: '今天', id: 0}
                };
                /**期望送达时间 具体时间 start */
                $("#dropdown-menu").on("click", "li a", function () {
                    $("#dropdownBtn").html($.trim(this.innerText) + " <span class='caret'></span>");
                    if ($.trim(this.innerText) == '立即配送') {
                        $("#dropdownBtn").val('now');
                    } else {
                        $("#dropdownBtn").val($.trim(this.innerText));
                    }
                });
                var buildDropMenu = function (hour, min, type) {
                    var liBefore = "<li role=‘presentation’ > <a role='menuitem' tabindex='-1' >";
                    type == 0 ? $("#dropdown-menu").append(liBefore + "立即配送</a></li>") : $("#dropdown-menu").append(liBefore + "00:00</a></li>");
                    while (hour < 24) {
                        if (min <= 30) {
                            var text = hour < 10 ? '0' + hour : hour;
                            $("#dropdown-menu").append(liBefore + text + ":30</a></li>");
                        }
                        if (hour != 23) {
                            var text = (hour + 1) < 10 ? '0' + (hour + 1) : hour + 1;
                            $("#dropdown-menu").append(liBefore + text + ":00</a></li>");
                        }
                        min = 0;
                        hour++;
                    }
                };
                $scope.changeTimeType = function (x) {
                    if (x.id == 0) {
                        $("#dropdownBtn").html("立即配送 <span class='caret'></span>");
                        $("#dropdownBtn").val('now');
                        $("#dropdown-menu").find("li").remove();
                        initDateMenu();
                    } else if (x.id == 1) {
                        $("#dropdownBtn").html("00:00 <span class='caret'></span>");
                        $("#dropdownBtn").val('00:00');
                        $("#dropdown-menu").find("li").remove();
                        buildDropMenu(0, 0, x.id);
                    }
                };
                var initDateMenu = function () {
                    orderBiz.getSystemDate().then(function (result) {
                        if (result.success) {
                            var now = new Date(result.object);
                            buildDropMenu(now.getHours() + 1, now.getMinutes(), 0);
                        } else {
                            buildDropMenu(new Date().getHours() + 1, new Date().getMinutes(), 0);
                        }
                    }, function (errorResult) {
                        buildDropMenu(new Date().getHours() + 1, new Date().getMinutes(), 0);
                    });
                };
                initDateMenu();
                /** 期望送达时间 具体时间 end */
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
                    remark: '',//备注
                    expectDate: '',//期望送达时间
                    lon: '',//收货地址经度
                    lat: ''//收货地址纬度
                };
                var map;//地图
                var initMap = function () {
                    $scope.localtionBtn = true;//定位按钮显示标记
                    try {
                        $("#orderCreateMapContainer").children().remove();
                        map = new AMap.Map('orderCreateMapContainer', {
                            center: [$rootScope.authUser.lng, $rootScope.authUser.lat],
                            zoom: 12
                        });
                    } catch (e) {
                        //如果地图加载失败,移除地图相关标签
                        $("#orderCreateMapContainer").parent().remove();
                        $scope.localtionBtn = false;
                        $ocsPopup.growl('地图初始化失败,请检查网络', {type: 'danger', delay: 1000});
                    }
                };
                //地址定位
                $scope.gpsLocaltion = function () {
                    var cityCode = $rootScope.authUser.belongCityCode;//城市
                    if (!cityCode) {
                        $ocsPopup.growl('城市代码不正确', {type: 'danger', delay: 1000});
                        return;
                    }
                    if (!$scope.query.contactAddress) {
                        $ocsPopup.growl('请输入详细地址', {type: 'danger', delay: 1000});
                        return;
                    }
                    try {
                        AMap.service(["AMap.PlaceSearch"], function () {
                            var placeSearch = new AMap.PlaceSearch({ //构造地点查询类
                                pageSize: 5,
                                pageIndex: 1,
                                city: cityCode
                            });
                            //关键字查询
                            placeSearch.search($scope.query.contactAddress, callback);
                            var placeSearchRender = new Lib.AMap.PlaceSearchRender({
                                finishCallback: function (element, data) {
                                    //点击确定后回调逻辑
                                    var text = element.find(".amap-lib-infowindow-content").prev(".amap-lib-infowindow-title")[0].innerText;
                                    $scope.query.contactAddress = text.substr(2, text.indexOf('详情') - 2).trim();
                                    $scope.query.lon = data.location.lng;
                                    $scope.query.lat = data.location.lat;
                                    $scope.$apply();
                                }
                            });

                            function callback(status, result) {
                                if (status === 'complete' && result.info === 'OK') {
                                    placeSearchRender.autoRender({
                                        placeSearchInstance: placeSearch,
                                        panel: "panel",
                                        methodName: "search",
                                        methodArgumments: [$scope.query.contactAddress, callback],
                                        data: result,
                                        map: map
                                    });
                                }
                            }
                        });
                    } catch (e) {
                        $ocsPopup.growl('地图查询失败', {type: 'danger', delay: 1000});
                    }
                };
                //TODO 经纬度校验与设置
                var setReceiveLonAndLat = function () {
                    if (!$scope.query.lon || !$scope.query.lat) {

                    }
                };
                //收件联系方式监控 用于收件信息联想
                $scope.$watch('query.contactMobile', function (newValue, oldValue, scope) {
                    //TODO 暂时只取最新一条
                    if (newValue && (ValidateBiz.reg(4, newValue))) {
                        //从远程服务获取地址簿
                        orderBiz.getAddressBookList({
                            mobile: newValue,
                            shopCode: $rootScope.authUser.shopCode
                        }).then(function (result) {
                            if (result.success) {
                                var links = result.object;
                                if (links.length > 0) {
                                    for (var i = 0; i < links.length; i++) {
                                        if (newValue == links[i].contactMobile) {
                                            scope.query.contactPerson = links[i].contactName;
                                            scope.query.contactAddress = links[i].contactAddress;
                                            break;
                                        }
                                    }
                                } else {
                                    console.log("result:" + result);
                                }
                            } else {
                                console.log("result:" + result);
                            }
                        }, function (errorResult) {
                            $ocsPopup.growl(errorResult.text, {type: 'danger', delay: 500});
                        });
                    }
                    if (!newValue) {
                        scope.query.contactPerson = "";
                        scope.query.contactAddress = "";
                    }
                });
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
                        } else if (!result.object || result.object.length == 0) {
                            $ocsPopup.growl("该商家没有商品类别", {type: 'danger'});
                        } else {
                            $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                        }
                    }, function (errorResult) {
                        $ocsPopup.growl(errorResult.text, {type: 'danger'});
                    });
                    //加载地图
                    initMap();
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
                    var orderNoRe = /^[A-Za-z0-9]+$/;
                    if (!orderNoRe.test($scope.genOrderNo)) {
                        $ocsPopup.growl('请输入正确订单号格式(只能是字母或数字)', {type: 'danger'});
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
                    var expectTime = $("#dropdownBtn").val();
                    if ($.trim(expectTime) != 'now') {
                        $scope.query.expectDate = getFormatDate($scope.timeTypeSelector.selectedOption.id) + " " + expectTime + ":00";
                    }
                    //TODO 设置收货地址经纬度
                    setReceiveLonAndLat();
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
                function getFormatDate(day) {//0-今天，1-明天，-1-昨天
                    var date = new Date();
                    var month = date.getMonth() + 1;
                    var strDate = date.getDate() + day;
                    if (month >= 1 && month <= 9) {
                        month = "0" + month;
                    }
                    if (strDate >= 0 && strDate <= 9) {
                        strDate = "0" + strDate;
                    }
                    return date.getFullYear() + '-' + month + '-' + strDate;
                }

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
                    //var et = {name:'立即配送', id:0};
                    //$scope.changeTimeType(et);
                    //重置地图
                    initMap();
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
        .controller('orderAuditCtrl', ['$rootScope', '$scope', '$state', 'orderBiz', '$ocsPopup', '$cookies', 'SystemConfig', 'shopBiz', 'CacheBiz', 'ValidateBiz',
            function ($rootScope, $scope, $state, orderBiz, $ocsPopup, $cookies, SystemConfig, shopBiz, CacheBiz, ValidateBiz) {
                //待审核订单
                $scope.totalCount = 0;//总数
                $scope.currentPage = 1;//当前页
                $scope.pageCount = 0;//页数
                $scope.pageSize = 10;//每页条数
                $scope.startDate = new Date();
                $scope.endDate = new Date();
                $scope.query = {
                    receiveMobile: '',//收件人手机
                    status: '0',//订单状态 0(全部)1(待审核)2(取消)3(已审核)
                    startDate: '',//开始时间
                    endDate: '',//结束时间
                    page: 0,//当前页（坐标0开始）
                    pageSize: $scope.pageSize//页面条数
                };
                //状态下拉框
                $scope.selector = {
                    availableOptions: [
                        {id: '0', name: '全部'},
                        {id: '1', name: '未审核'},
                        {id: '2', name: '取消'},
                        {id: '3', name: '已审核'}
                    ],
                    selectedOption: {id: '0', name: '全部'}
                };
                //table
                $scope.orderAuditTable = {
                    id: "orderAuditTable", //必须是id,通过jquery主键选择器获取
                    columns: [
                        {field: 'flag'},
                        {field: 'sfOrderNo'},
                        {field: 'receiveMobile'},
                        {field: 'receiveAddress'},
                        {field: 'pickupMobile'},
                        {field: 'shopOrderNo'},
                        {field: 'machineNo'},
                        {field: 'createTime'},
                        {field: 'expectDatePeriod'},
                        {field: 'distance'},
                        {field: 'statusInfo'}
                    ],
                    //普通行点击事件
                    clickRowCallback: function (e, row, $tr, $td) {
                        $scope.originAddress = row.receiveAddress;
                        if ($td == "modifyAddress" && row.status == 1) {
                            $scope.auditOrder = {
                                oldShopOrderNo:row.shopOrderNo,
                                newShopOrderNo:row.shopOrderNo,
                                receiveContacts:row.receiveContacts,
                                receiveAddress:row.receiveAddress,
                                receiveMobile:row.receiveMobile,
                                pickupMobile:row.pickupMobile,
                                provinceName:$rootScope.authUser.provinceName,
                                cityName:$rootScope.authUser.cityName,
                                weightSelector:{},
                                areaSelector:{},
                                weight:'',
                                receiveAreaName:'',
                                machineNo:row.machineNo,
                                distance:row.distance,
                                expectTimeSelector:{},
                                expectTimeWarn:1,
                                expectDatePeriod:row.expectDatePeriod
                            };
                            shopBiz.shopWeightOption().then(function (result) {
                                if (result.success && result.object.length > 0) {
                                    var weights = [];
                                    for (var i = 0; i < result.object.length; i++) {
                                        weights.push({id: result.object[i].id, name: result.object[i].name});
                                    }
                                    $scope.auditOrder.weightSelector.selectedOption = weights[0];
                                    for (i = 0; i < weights.length; i++) {
                                        if (weights[i].id == row.weight) {
                                            $scope.auditOrder.weightSelector.selectedOption = weights[i];
                                            break;
                                        }
                                    }
                                    $scope.auditOrder.weightSelector.availableOptions = weights;
                                } else {
                                    $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                                }
                            }, function (errorResult) {
                                $ocsPopup.growl(errorResult.text, {type: 'danger'});
                            });
                            shopBiz.shopAreas({cityCode: $rootScope.authUser.cityCode}).then(function (result) {
                                if (result.success && result.object.length > 0) {
                                    var areas = [];
                                    for (var i = 0; i < result.object.length; i++) {
                                        areas.push({id: i + 1, name: result.object[i]});
                                    }
                                    $scope.auditOrder.areaSelector.selectedOption = areas[0];
                                    for (i = 0; i < areas.length; i++) {
                                        if (areas[i].name == row.receiveAreaName) {
                                            $scope.auditOrder.areaSelector.selectedOption = areas[i];
                                            break;
                                        }
                                    }
                                    $scope.auditOrder.areaSelector.availableOptions = areas;
                                } else {
                                    $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                                }
                            }, function (errorResult) {
                                $ocsPopup.growl(errorResult.text, {type: 'danger'});
                            });
                            shopBiz.shopExpectTimeOption({shopCode: $scope.authUser.shopCode}).then(function (result) {
                                if (result.success && result.object.length > 0) {
                                    var expectTimes = [];
                                    for (var i = 0; i < result.object.length; i++) {
                                        expectTimes.push({id: result.object[i].id, name: result.object[i].name});
                                    }
                                    $scope.auditOrder.expectTimeSelector.selectedOption = expectTimes[0];
                                    for (i = 0; i < expectTimes.length; i++) {
                                        if (expectTimes[i].name == row.expectDatePeriod) {
                                            $scope.auditOrder.expectTimeSelector.selectedOption = expectTimes[i];
                                            $scope.auditOrder.expectTimeWarn = '';
                                            break;
                                        }
                                    }
                                    if (!row.expectDatePeriod) {
                                        $scope.auditOrder.expectTimeWarn = '';
                                    }
                                    $scope.auditOrder.expectTimeSelector.availableOptions = expectTimes;
                                } else {
                                    $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                                }
                            }, function (errorResult) {
                                $ocsPopup.growl(errorResult.text, {type: 'danger'});
                            });
                            $ocsPopup.confirm({
                                id: 'modifyAddressModal',
                                templateUrl: 'js/app/template/modifyAuditOrder.html',
                                scope: $scope
                            }).then(function (res) {
                                if (res) {
                                    $scope.auditOrder.weight = $scope.auditOrder.weightSelector.selectedOption.id;
                                    $scope.auditOrder.receiveAreaName = $scope.auditOrder.areaSelector.selectedOption.name;
                                    if ($scope.auditOrder.newShopOrderNo == $scope.auditOrder.oldShopOrderNo) {
                                        $scope.auditOrder.newShopOrderNo = "";
                                    }
                                    $scope.auditOrder.expectDate = $scope.auditOrder.expectTimeSelector.selectedOption.id;
                                    orderBiz.modifyAuditOrder($scope.auditOrder).then(
                                        function (result) {
                                            if (result.success) {
                                                $ocsPopup.growl('修改成功', {type: 'success'});
                                                $scope.search();
                                            } else {
                                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                                            }
                                        }, function (errorResult) {
                                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                                        }
                                    );
                                }
                            });
                            $scope.calDistance = function () {
                                if ($scope.originAddress == $scope.auditOrder.receiveAddress) {
                                    return;
                                }
                                var address = $scope.auditOrder.provinceName + $scope.auditOrder.cityName +
                                    $scope.auditOrder.areaSelector.selectedOption.name + $scope.auditOrder.receiveAddress;
                                shopBiz.shopCalDistance({address:address}).then(
                                    function (result) {
                                        if (result.success) {
                                            $scope.auditOrder.distance = result.object;
                                            $scope.originAddress = $scope.auditOrder.receiveAddress;
                                        } else {
                                            $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                                        }
                                    }, function (errorResult) {
                                        $ocsPopup.growl(errorResult.text, {type: 'danger'});
                                    });
                            };
                        } else if ($td == "cancelOrder" && row.status == 1) {
                            if (row.status != '1') return;
                            $ocsPopup.confirm({
                                scope: $scope,
                                content: "确认取消订单?"
                            }).then(function (res) {
                                if (res) {
                                    orderBiz.cancelAuditOrder({shopOrderNo: row.shopOrderNo}).then(function (result) {
                                        if (result.success) {
                                            $ocsPopup.growl("取消成功", {type: 'success'});
                                            getAuditOrders($scope.query);
                                        } else {
                                            $ocsPopup.growl(result.errorInfo, {type: 'danger'});
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
                    },
                    //权限控制回调函数
                    accessControlCallback: function () {
                        //修改地址(暂时不加权限)
                        $scope.orderAuditTable.columns.push({
                            field: 'modifyAddress', class: "modify-operation",
                            formatter: function (value, row, index) {
                                return (row.status == '1' ? true : false) ? "<span style='cursor: pointer' " +
                                "type='button' class='text-blue'>修改</span>" : "<span type='button' class='text-dark'>--</span>";
                            }
                        });
                        $('#' + $scope.orderAuditTable.id).find('tr').append('<th data-field="modifyAddress" data-align="center">地址修改</th>');
                        //取消订单(暂时不加权限)
                        $scope.orderAuditTable.columns.push({
                            field: 'cancelOrder', class: "cancel-operation",
                            formatter: function (value, row, index) {
                                var html = "";
                                if (row.status == '1') {
                                    html = "<span style='cursor: pointer' " +
                                    "type='button' class='text-blue'>取消</span>";
                                } else {
                                    html = "<span type='button' class='text-dark'>--</span>";
                                }
                                return html;
                            }
                        });
                        $('#' + $scope.orderAuditTable.id).find('tr').append('<th data-field="cancelOrder" data-align="center">订单取消</th>');
                    },
                    templateUrl: "js/app/template/orderAuditTable.html" //指令模板,可自行定制,遵循bootstrap-table格式
                };
                $scope.search = function () {
                    $scope.query.page = 0;
                    $scope.currentPage = 1;
                    $scope.query.status = $scope.selector.selectedOption.id;
                    if (!$scope.startDate && !$scope.endDate) {
                        $ocsPopup.growl('请输入下单时间', {type: 'danger'});
                        return;
                    }
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
                    getAuditOrders($scope.query);
                };
                $scope.orderList = []; // 存储当页的订单列表
                var getAuditOrders = function (condition) {
                    $scope.loading = true;
                    $ocsPopup.showLoading(true, $('#' + $scope.orderAuditTable.id));
                    orderBiz.getAuditOrderList(condition).then(
                        function (result) {
                            $scope.loading = false;
                            $ocsPopup.showLoading(false, $('#' + $scope.orderAuditTable.id));
                            if (result.success) {
                                $scope.totalCount = result.object.count;
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
                                for (var i = 0; i < result.object.orders.length; i++) {
                                    $scope.orderList.push(result.object.orders[i]);
                                }
                                $('#' + $scope.orderAuditTable.id).bootstrapTable('load', {
                                    data: result.object.orders
                                });
                            } else {
                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                            }
                        }, function (errorResult) {
                            $scope.loading = false;
                            $ocsPopup.showLoading(false, $('#' + $scope.orderAuditTable.id));
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                        }
                    );
                }; // getAuditOrders end
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
                    $scope.query.page = $scope.currentPage - 1;
                    getAuditOrders($scope.query);
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
                    $scope.query.page = $scope.currentPage - 1;
                    getAuditOrders($scope.query);
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
                    $scope.query.page = $scope.currentPage - 1;
                    getAuditOrders($scope.query);
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
                    $scope.query.page = $scope.currentPage - 1;
                    getAuditOrders($scope.query);
                };
                // 审核订单并打印
                $scope.audit = function () {
                    var nodes = $('#' + $scope.orderAuditTable.id).bootstrapTable('getAllSelections');
                    if (nodes.length == 0) {
                        $ocsPopup.growl('请选择一个未审核订单', {type: 'danger'});
                        return;
                    }
                    if (nodes.length > 1) {
                        $ocsPopup.growl('不可多选，请选择一个未审核订单', {type: 'danger'});
                        return;
                    }
                    var order = nodes[0];
                    if (order.status != 1) {
                        $ocsPopup.growl('请选择未审核的订单', {type: 'danger'});
                        return;
                    }
                    $scope.originAddress = order.receiveAddress;
                    $scope.auditOrder = {
                        oldShopOrderNo:order.shopOrderNo,
                        newShopOrderNo:order.shopOrderNo,
                        receiveContacts:order.receiveContacts,
                        receiveAddress:order.receiveAddress,
                        receiveMobile:order.receiveMobile,
                        pickupMobile:order.pickupMobile,
                        provinceName:$rootScope.authUser.provinceName,
                        cityName:$rootScope.authUser.cityName,
                        weightSelector:{},
                        areaSelector:{},
                        weight:'',
                        receiveAreaName:'',
                        machineNo:order.machineNo,
                        distance:order.distance,
                        expectTimeSelector:{},
                        expectTimeWarn:1,
                        expectDatePeriod:order.expectDatePeriod
                    };
                    shopBiz.shopWeightOption().then(function (result) {
                        if (result.success && result.object.length > 0) {
                            var weights = [];
                            for (var i = 0; i < result.object.length; i++) {
                                weights.push({id: result.object[i].id, name: result.object[i].name});
                            }
                            $scope.auditOrder.weightSelector.selectedOption = weights[0];
                            for (i = 0; i < weights.length; i++) {
                                if (weights[i].id == order.weight) {
                                    $scope.auditOrder.weightSelector.selectedOption = weights[i];
                                    break;
                                }
                            }
                            $scope.auditOrder.weightSelector.availableOptions = weights;
                        } else {
                            $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                        }
                    }, function (errorResult) {
                        $ocsPopup.growl(errorResult.text, {type: 'danger'});
                    });
                    shopBiz.shopAreas({cityCode: $rootScope.authUser.cityCode}).then(function (result) {
                        if (result.success && result.object.length > 0) {
                            var areas = [];
                            for (var i = 0; i < result.object.length; i++) {
                                areas.push({id: i + 1, name: result.object[i]});
                            }
                            $scope.auditOrder.areaSelector.selectedOption = areas[0];
                            for (i = 0; i < areas.length; i++) {
                                if (areas[i].name == order.receiveAreaName) {
                                    $scope.auditOrder.areaSelector.selectedOption = areas[i];
                                    break;
                                }
                            }
                            $scope.auditOrder.areaSelector.availableOptions = areas;
                        } else {
                            $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                        }
                    }, function (errorResult) {
                        $ocsPopup.growl(errorResult.text, {type: 'danger'});
                    });
                    shopBiz.shopExpectTimeOption({shopCode: $scope.authUser.shopCode}).then(function (result) {
                        if (result.success && result.object.length > 0) {
                            var expectTimes = [];
                            for (var i = 0; i < result.object.length;   i++) {
                                expectTimes.push({id: result.object[i].id, name: result.object[i].name});
                            }
                            $scope.auditOrder.expectTimeSelector.selectedOption = expectTimes[0];
                            for (i = 0; i < expectTimes.length; i++) {
                                if (expectTimes[i].name == order.expectDatePeriod) {
                                    $scope.auditOrder.expectTimeSelector.selectedOption = expectTimes[i];
                                    $scope.auditOrder.expectTimeWarn = '';
                                    break;
                                }
                            }
                            if(!order.expectDatePeriod){
                                $scope.auditOrder.expectTimeWarn = '';
                            }
                            $scope.auditOrder.expectTimeSelector.availableOptions = expectTimes;
                        } else {
                            $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                        }
                    }, function (errorResult) {
                        $ocsPopup.growl(errorResult.text, {type: 'danger'});
                    });
                    $ocsPopup.confirm({
                        id: 'auditScOrderModal',
                        templateUrl: 'js/app/template/auditScOrder.html',
                        scope: $scope
                    }).then(function (res) {
                        if (!$scope.auditOrder.receiveContacts) {
                            $ocsPopup.growl('请输入收件人姓名', {type: 'danger'});
                            return;
                        }
                        if (res) {
                            $scope.auditOrder.weight = $scope.auditOrder.weightSelector.selectedOption.id;
                            $scope.auditOrder.receiveAreaName = $scope.auditOrder.areaSelector.selectedOption.name;
                            if ($scope.auditOrder.newShopOrderNo == $scope.auditOrder.oldShopOrderNo) {
                                $scope.auditOrder.newShopOrderNo = "";
                            }
                            $scope.auditOrder.expectDate = $scope.auditOrder.expectTimeSelector.selectedOption.id;
                            orderBiz.auditScOrder($scope.auditOrder).then(
                                function (result) {
                                    if (result.success) {
                                        $scope.search();
                                        var orderNos = [result.object];
                                        orderBiz.getPrintOrderList({orderNos: orderNos.toString()}).then(function (result) {
                                            if (result.success) {
                                                var checkedOrders = result.object;
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
                                                CacheBiz.setCacheToSession(SystemConfig.orderInfo, checkedOrders);
                                                //跳转至打印页面
                                                window.open(SystemConfig.url_print);
                                            } else {
                                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                                            }
                                        }, function (errorResult) {
                                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                                        });
                                    } else {
                                        $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                                    }
                                }, function (errorResult) {
                                    $ocsPopup.growl(errorResult.text, {type: 'danger'});
                                }
                            );
                        }
                    });
                    $scope.calDistance = function () {
                        if ($scope.originAddress == $scope.auditOrder.receiveAddress) {
                            return;
                        }
                        var address = $scope.auditOrder.provinceName + $scope.auditOrder.cityName +
                            $scope.auditOrder.areaSelector.selectedOption.name + $scope.auditOrder.receiveAddress;
                        shopBiz.shopCalDistance({address:address}).then(
                            function (result) {
                                if (result.success) {
                                    $scope.auditOrder.distance = result.object;
                                    $scope.originAddress = $scope.auditOrder.receiveAddress;
                                } else {
                                    $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                                }
                            }, function (errorResult) {
                                $ocsPopup.growl(errorResult.text, {type: 'danger'});
                            });
                    };
                };
            }
        ])
});
