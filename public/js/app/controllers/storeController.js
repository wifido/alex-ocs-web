define([
    'angular'
], function (angular) {
    'use strict';
    return angular.module('appCtrls.storeCtrls', [])
        //门店管理
        .controller('storeManagerCtrl', ['$scope', '$state', '$rootScope', '$cookies', 'storeBiz', '$ocsPopup',
            function ($scope, $state, $rootScope, $cookies, storeBiz, $ocsPopup) {

                $scope.storeCode = {
                    storeCode: $rootScope.authUser.shopCode
                };

                //当前店铺的经纬度坐标
                $scope.lng = $rootScope.authUser.lng;
                $scope.lat = $rootScope.authUser.lat;


                $scope.arrivalRate = 0;
                //40分钟送达率
                $scope.backRate = 0;

                //平均订单时长
                $scope.orderTimeAvg = 0;

                //平均取货时长
                $scope.pickupTimeAvg = 0;

                //平均妥投时长
                $scope.deliveryTimeAvg = 0;

                //时效内妥投占比
                $scope.deliveryInTimeRate = 0;

                //妥投失效异常单
                $scope.excptionDeliveryInTime = 0;

                //在途订单数量
                $scope.onTheWayOrder = 0;

                //已完成订单量
                $scope.completedOrder = 0;



                //加载地图
                $scope.map = new AMap.Map('mapContainer', {
                    zoom: 12,
                    center: [$scope.lng, $scope.lat]
                });

                //加载地图插件
                AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], function () {
                    var toolBar = new AMap.ToolBar();
                    var scale = new AMap.Scale();
                    $scope.map.addControl(toolBar);
                    $scope.map.addControl(scale);
                });

                //加载店铺标记
                new AMap.Marker({
                    map: $scope.map,
                    position: [$scope.lng, $scope.lat],
                    icon: new AMap.Icon({
                        size: new AMap.Size(40, 50),  //图标大小
                        image: "/images/store_location.png",
                        imageOffset: new AMap.Pixel(0, 0)
                    })
                });


                //加载店铺范围圆形覆盖
                new AMap.Circle({
                    map: $scope.map,
                    center: new AMap.LngLat($scope.lng, $scope.lat),// 圆心位置
                    radius: 7000, //半径(米)
                    strokeColor: "#4199d0", //线颜色
                    strokeOpacity: 1, //线透明度
                    strokeWeight: 3, //线粗细度
                    fillColor: "#4199d0", //填充颜色
                    fillOpacity: 0.35//填充透明度
                });

                //初始化表格
                $('#storeOrderTable').bootstrapTable({
                    columns: [
                        {
                            field: "flag"
                        },
                        {
                            field: "flag",
                            formatter: function (value, row, index) {
                                return index + 1;
                            }
                        },
                        {
                            field: 'storeName',
                            formatter: function (value, row, index) {
                                return $rootScope.authUser.shopName;
                            }
                        },
                        {
                            field: 'name'

                        },
                        {
                            field: 'id'

                        },
                        {
                            field: 'contact'
                        },
                        {
                            field: 'type'
                        },
                        {
                            field: 'status'
                        }
                        ,
                        {
                            field: 'orders',
                            formatter: function (value, row, index) {
                                return "<span >" + row.onTheWayOrder + "/" + row.completedOrder + "</span>";
                            }
                        }
                        ,
                        {
                            field: 'currentOrders',
                            formatter: function (value, row, index) {
                                var html = "";
                                if (value !== null) {
                                    for (var i = 0; i < value.length; i++) {
                                        html += "<span style='cursor: pointer' class='text-blue' onclick='showOrder(\"" + value[i] +"\")'>" + value[i] + "</span>";
                                        if (i != value.length - 1) {
                                            html += "</br>";
                                        }
                                    }
                                }

                                return html;
                            }
                        },
                        {
                            field: 'operation',
                            formatter: function (value, row, index) {
                                return "<span style='cursor: pointer' onclick='showDeliveryEmp(\"" + row.name + "\",\"" + row.contact + "\",\"" + row.resourceId + "\",\""
                                    + row.onTheWayOrder + "\",\"" + row.completedOrder
                                    + "\")'  class='text-blue'>详情</span>"

                            }

                        }
                    ]
                });

                function getEmpListAndNum() {

                    $scope.atWorkEmpNum = 0;
                    $scope.totalEmpNum=0;

                    $('#storeOrderTable').bootstrapTable('removeAll');

                    //根据店铺编码获取配送员信息相关
                    storeBiz.getEmpListAndNum($scope.storeCode).then(
                        function (result) {
                            if (result.success) {

                                //拿到相关配送员列表和配送员的地理信息
                                $scope.empList = result.object;

                                //当前配送人数
                                $scope.atWorkEmpNum = $scope.empList.atWorkEmpNum;
                                //店铺总配送人数
                                $scope.totalEmpNum = $scope.empList.totalEmpNum;
                                $scope.deliveryEmps = $scope.empList.deliveryEmps;//配送员列表

                                for (var i = 0; i < $scope.deliveryEmps.length; i++) {
                                    if ($scope.deliveryEmps[i].status === "驻店") {
                                        //画地图标记
                                        if($scope.deliveryEmps[i].lng && $scope.deliveryEmps[i].lat){
                                            new AMap.Marker({
                                                map: $scope.map,
                                                position: [$scope.deliveryEmps[i].lng, $scope.deliveryEmps[i].lat],
                                                icon: new AMap.Icon({
                                                    size: new AMap.Size(35, 42),  //图标大小
                                                    image: "/images/store_deliveryEmp.png",
                                                    imageOffset: new AMap.Pixel(0, 0)
                                                }),
                                                label: {
                                                    content:'<div class="mapSan">'+$scope.deliveryEmps[i].name+'</div>',
                                                    offset:new AMap.Pixel(2, -22)
                                                }
                                            });

                                            new AMap.Marker({
                                                map: $scope.map,
                                                offset:new AMap.Pixel(-20, 11),
                                                position: [$scope.deliveryEmps[i].lng, $scope.deliveryEmps[i].lat],
                                                content: '<div ><span  class="amap-marker-label span3">'+$scope.deliveryEmps[i].onTheWayOrder+
                                                '</span><span class="amap-marker-label-red span3">'+$scope.deliveryEmps[i].completedOrder+'</span></div>'
                                            });
                                        }

                                    }

                                }

                                reloadStoreOrderTable($scope.deliveryEmps);

                            } else {
                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                            }

                        },
                        function (errorResult) {
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                        }
                    );
                }

                //重新加载配送员订单列表
                function reloadStoreOrderTable(data) {
                    $('#storeOrderTable').bootstrapTable('load', {
                        data: data
                    });
                }

                getEmpListAndNum();

                $scope.storeKpiQuery = {
                    storeCode: $rootScope.authUser.shopCode,
                    type: $rootScope.authUser.userType
                };
                //根据店铺编码查店铺指标
                storeBiz.getStoreKpi($scope.storeKpiQuery).then(
                    function (result) {
                        if (result.success) {

                            $scope.storeKpi = result.object;

                            //10分钟到店率
                            $scope.arrivalRate = $scope.storeKpi.arrivalRate;
                            //40分钟送达率
                            $scope.backRate = $scope.storeKpi.backRate;

                            //平均订单时长
                            $scope.orderTimeAvg = $scope.storeKpi.orderTimeAvg;

                            //平均取货时长
                            $scope.pickupTimeAvg = $scope.storeKpi.pickupTimeAvg;

                            //平均妥投时长
                            $scope.deliveryTimeAvg = $scope.storeKpi.deliveryTimeAvg;

                            //时效内妥投占比
                            $scope.deliveryInTimeRate = $scope.storeKpi.deliveryInTimeRate;

                            //妥投失效异常单
                            $scope.excptionDeliveryInTime = $scope.storeKpi.excptionDeliveryInTime;

                            //在途订单数量
                            $scope.onTheWayOrder = $scope.storeKpi.onTheWayOrder;

                            //已完成订单量
                            $scope.completedOrder = $scope.storeKpi.completedOrder;


                        } else {
                            $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                        }

                    },
                    function (errorResult) {
                        $ocsPopup.growl(errorResult.text, {type: 'danger'});
                    }
                );


                //根据店铺编码查尚未分配订单数量
                $scope.undistributedOrderNum = 0;
                storeBiz.getUndistributedOrderNum($scope.storeCode).then(
                    function (result) {
                        if (result.success) {
                            $scope.undistributedOrderNum = result.object;//尚未分配订单数量
                        } else {
                            $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                        }
                    },
                    function (errorResult) {
                        $ocsPopup.growl(errorResult.text, {type: 'danger'});
                    }
                );


                //根据店铺编码查尚未分配订单列表
                $scope.showUndistributedOrderList= function () {

                    storeBiz.getUndistributedOrderList($scope.storeCode).then(

                        function (result) {
                            if (result.success) {
                                if(result.object != null){
                                    $scope.UndistributedOrderLis = result.object;
                                }



                                $('#undistributedOrderListTable').bootstrapTable({
                                    data: $scope.UndistributedOrderLis,
                                    columns:[
                                        {
                                            field: "orderNo"
                                        },
                                        {
                                            field: "empName",
                                            formatter:function (value,row,index) {

                                                return value==null?" ":value;
                                            }
                                        },
                                        {
                                            field: "contact",
                                            formatter:function (value,row,index) {
                                                return value==null?" ":value;
                                            }
                                        },
                                        {
                                            field: "predictDate"
                                        }
                                    ]
                                });

                                $('#undistributedOrderListModal').modal('show');

                            } else {
                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                            }

                        },
                        function (errorResult) {
                            $('#undistributedOrderListModal').modal('show');
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});

                        }
                    );
                };


                //查看该收派员的当天订单列表和配送员指标
                $('#empKpiAndOrderModal').on('shown.bs.modal', function () {

                    $scope.empKpiAndOrderQuery = {
                        storeCode: $rootScope.authUser.shopCode,
                        contact: $("input[name='empContact']").val(),
                        resourceId: $("input[name='resourceId']").val()

                    };

                    $scope.empCompletedOrder = $("input[name='empCompletedOrder']").val();
                    $scope.empOnTheWayOrder = $("input[name='empOnTheWayOrder']").val();


                    $('#deliveryEmpOrderListTable').bootstrapTable({
                        columns: [
                            {
                                field: "name",
                                formatter: function () {
                                    return $("input[name='modelEmpName']").val();
                                }
                            },
                            {
                                field: "contact",
                                formatter: function () {
                                    return $("input[name='empContact']").val();
                                }
                            },
                            {
                                field: 'orderNo'
                            },
                            {
                                field: 'endTime',
                                formatter: function (value) {
                                    if (value == null || value == "") {
                                        return null;
                                    } else {
                                        var date = new Date(value);
                                        var Y = date.getFullYear() + '-';
                                        var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
                                        var D = date.getDate() + ' ';
                                        var h = date.getHours() + ':';
                                        var m = date.getMinutes() + ':';
                                        var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
                                        return (Y + M + D + h + m + s);
                                    }

                                }

                            },
                            {
                                field: 'predictEndTime',
                                formatter: function (value) {
                                    var date = new Date(value);
                                    var Y = date.getFullYear() + '-';
                                    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
                                    var D = date.getDate() + ' ';
                                    var h = date.getHours() + ':';
                                    var m = date.getMinutes() + ':';
                                    var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
                                    return (Y + M + D + h + m + s);
                                }

                            },
                            {
                                field: 'status'
                            }]
                    });

                    storeBiz.getDeliveryEmpKpiAndOrders($scope.empKpiAndOrderQuery).then(
                        function (result) {

                            if (result.success) {

                                $scope.empKpiAndOrdersDto = result.object;
                                //10分钟到店率
                                $scope.empArrivalRate = $scope.empKpiAndOrdersDto.arrivalRate;
                                //40分钟送达率
                                $scope.empBackRate = $scope.empKpiAndOrdersDto.backRate;

                                //时效内妥投占比
                                $scope.empDeliveryInTimeRate = $scope.empKpiAndOrdersDto.deliveryInTimeRate;

                                $scope.empTaskInfos = $scope.empKpiAndOrdersDto.taskInfos;


                                $('#deliveryEmpOrderListTable').bootstrapTable('load', {
                                    data: $scope.empTaskInfos
                                });


                            } else {
                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                            }
                        },
                        function (errorResult) {
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                        }
                    );

                });



                //查看订单详情
                $('#orderDetailModal').on('shown.bs.modal', function () {

                    $scope.orderNoQuery = {
                        orderNo: $("input[name='orderDetailNo']").val()
                    };
                    
                    $('#orderDetailTable').bootstrapTable();

                    storeBiz.getOrderDetail($scope.orderNoQuery).then(
                        function (result) {

                            if (result.success) {

                                $scope.orderDetailDto = result.object;

                                $('#orderDetailTable').bootstrapTable('load', {
                                    data: $scope.orderDetailDto
                                });


                            } else {
                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                            }
                        },
                        function (errorResult) {
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                        }
                    );

                });


                //通过订单号和配送员姓名搜索
                $scope.doSearch = function () {
                    $scope.empAndOrderQuery = {
                        orderNo: $scope.orderNo,
                        empName: $scope.empName,
                        storeCode: $rootScope.authUser.shopCode
                    };

                    storeBiz.getEmpListByOrderNoAndEmpName($scope.empAndOrderQuery).then(
                        function (result) {
                            if (result.success) {

                                //得到配送员列表
                                $scope.deliveryEmpDto = result.object;

                                //获得查询后的配送员订单列表
                                reloadStoreOrderTable($scope.deliveryEmpDto);

                            } else {
                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                            }

                        },
                        function (errorResult) {
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                        }
                    );
                };


                //取消按钮
                $scope.doDismiss = function () {
                    $scope.orderNo = "";
                    $scope.empName = "";
                    getEmpListAndNum();
                };


                //弹出投诉界面
                $scope.complaint = function () {
                    $scope.checkRow = $('#storeOrderTable').bootstrapTable('getAllSelections');


                    if ($scope.checkRow.length > 1) {
                        $ocsPopup.growl("一次只能投诉一名快递员哦~", {type: 'danger'});
                        return;
                    }

                    if ($scope.checkRow.length == 0) {
                        $ocsPopup.growl("请选择快递员!", {type: 'danger'});
                        return;
                    }


                    $scope.empNameForComplain = $scope.checkRow[0].name;
                    $scope.empIdForComplain = $scope.checkRow[0].id;
                    $scope.complainReason = " ";
                    $('#complaintModal').modal('show');
                    $('#complainReason')[0].focus();
                    $('#complainReason').change();

                };

                //投诉  TODO 能否多次投诉
                $scope.doComplaint = function () {
                    $scope.complaintQuery = {
                        storeCode: $rootScope.authUser.shopCode,
                        storeName: $rootScope.authUser.shopName,
                        resourceIds: $scope.checkRow[0].resourceId,
                        empIds: $scope.checkRow[0].id,
                        message: $scope.complainReason
                    };

                    storeBiz.doComplaint($scope.complaintQuery).then(
                        function (result) {
                            if (result.success) {
                                $ocsPopup.growl('投诉成功', {type: 'success'});
                            } else {
                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                            }
                        },
                        function (errorResult) {
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});

                        }
                    );

                    $scope.complainReason = " ";
                    $('#complaintModal').modal('hide');
                };


                $scope.checkText = function () {
                    if ($scope.complainReason.length > 50) {
                        $scope.isShow = true;
                    } else {
                        $scope.isShow = false;
                    }
                };


                //显示催单提示按钮
                $scope.press = function () {

                    $scope.checkRow = $('#storeOrderTable').bootstrapTable('getAllSelections');
                    if ($scope.checkRow.length == 0 ) {
                        $ocsPopup.growl("请选择快递员!", {type: 'danger'});
                        return;
                    }

                    for(var i=0;i<$scope.checkRow.length ;i++){
                        if($scope.checkRow[i].currentOrders == null){
                            $ocsPopup.growl("选择的快递员必须存在订单才可以进行催单哦!", {type: 'danger'});
                            return;
                        }
                    }


                    $('#pressModal').modal('show');


                };

                //催单    TODO 能否多次催单
                $scope.doPress = function () {

                    for (var i = 0; i < $scope.checkRow.length; i++) {

                        $scope.pressOrderNos = $scope.checkRow[i].currentOrders;
                        $scope.flag = i;

                        $scope.urgeQuery = {
                            orderNos: $scope.pressOrderNos,
                            resourceId: $scope.checkRow[i].resourceId
                        };


                        storeBiz.doPress($scope.urgeQuery).then(
                            function (result) {
                                if (result.success) {

                                    $scope.pressEmpSuccess = $scope.checkRow[$scope.flag].name + " ";
                                    $scope.tip = "快递员: " + $scope.pressEmpSuccess + "催单成功";
                                    $ocsPopup.growl($scope.tip, {type: 'success'});
                                } else {
                                    $scope.pressEmpFailure = $scope.checkRow[$scope.flag].name + " ";
                                    $scope.tip = "快递员: " + $scope.pressEmpFailure + "催单失败";
                                    $ocsPopup.growl($scope.tip, {type: 'danger'});
                                }
                            },
                            function (errorResult) {

                                $scope.pressEmpFailure = $scope.checkRow[$scope.flag].name + " ";
                                $scope.tip = "快递员: " + $scope.pressEmpFailure + "催单失败";
                                $ocsPopup.growl($scope.tip, {type: 'danger'});
                            }
                        );
                    }

                    $('#pressModal').modal('hide');

                };

                //弹出资源申请界面 (本地调试通过)
                $scope.applyForResource = function () {
                    $scope.needPerson = 0;
                    $('#applyForResourceModal').modal('show');
                };

                //资源申请
                $scope.doApplyForResource = function () {

                    $scope.applyForResQuery = {
                        storeCode: $rootScope.authUser.shopCode,
                        storeName: $rootScope.authUser.shopName,
                        num: $scope.needPerson
                    };

                    storeBiz.doResApplication($scope.applyForResQuery).then(
                        function (result) {
                            if (result.success) {
                                $ocsPopup.growl('申请资源成功', {type: 'success'});
                            } else {

                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                            }
                        },
                        function (errorResult) {

                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                        }
                    );
                    $('#applyForResourceModal').modal('hide');
                };
            }])
        //商家管理
        .controller('merChantManagerCtrl', ['$scope', '$state', '$rootScope', '$cookies', 'storeBiz', '$ocsPopup',
            function ($scope, $state, $rootScope, $cookies, storeBiz, $ocsPopup) {

                //通过商家编码,查店铺位置信息列表

                $scope.merchantCode = {
                    merchantCode: $rootScope.authUser.shopCode
                };

                $scope.atWorkEmpNum = 0;
                $scope.totalEmpNum=0;
                $scope.arrivalRate = 0;
                //40分钟送达率
                $scope.backRate = 0;

                //平均订单时长
                $scope.orderTimeAvg = 0;

                //平均取货时长
                $scope.pickupTimeAvg = 0;

                //平均妥投时长
                $scope.deliveryTimeAvg = 0;

                //时效内妥投占比
                $scope.deliveryInTimeRate = 0;

                //妥投失效异常单
                $scope.excptionDeliveryInTime = 0;

                //在途订单数量
                $scope.onTheWayOrder = 0;

                //已完成订单量
                $scope.completedOrder = 0;


                //加载地图的方法
                $scope.map = new AMap.Map('mapContainer', {
                    zoom: 11
                });

                AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], function () {
                    var toolBar = new AMap.ToolBar();
                    var scale = new AMap.Scale();
                    $scope.map.addControl(toolBar);
                    $scope.map.addControl(scale);
                });

                $scope.title = ['请选择省', '请选择市', '请选择店铺'];
                initProvinceSelect(null);
                initCitySelect(null);
                initStoreSelect(null);

                $('#storeOrderTable').bootstrapTable({
                    columns: [
                        {
                            field: "cityName",
                            formatter: function () {
                                return $scope.cityName;
                            }
                        },
                        {
                            field: 'storeName',
                            formatter: function () {
                                return $scope.storeName;
                            }
                        },
                        {
                            field: 'name'

                        },
                        {
                            field: 'id'

                        },
                        {
                            field: 'contact'
                        },
                        {
                            field: 'type'
                        },
                        {
                            field: 'status'
                        }
                        ,
                        {
                            field: 'orders',
                            formatter: function (value, row, index) {
                                return "<span >" + row.onTheWayOrder + "/" + row.completedOrder + "</span>";
                            }
                        }
                        ,
                        {
                            field: 'operation',
                            formatter: function (value, row, index) {
                                return "<span style='cursor: pointer' onclick='showDeliveryEmp(\"" + row.name + "\",\"" + row.contact + "\",\"" + row.resourceId + "\",\""
                                    + row.onTheWayOrder + "\",\"" + row.completedOrder
                                    + "\")' type='button' class='text-blue'>详情</span>"

                            }

                        }
                    ]
                });

                storeBiz.getStoreLocation($scope.merchantCode).then(
                    function (result) {
                        if (result.success) {

                            $scope.objectList = result.object;

                            var province = [];

                            for (var i = 0; i < $scope.objectList.length; i++) {

                                var provinceObject = $scope.objectList[i];

                                var provinceSelect = {
                                    id: i,
                                    name: provinceObject.provinceName
                                };

                                province.push(provinceSelect);

                            }

                            initProvinceSelect(province);


                        } else {
                            $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                        }

                    }, function (errorResult) {
                        $ocsPopup.growl(errorResult.text, {type: 'danger'});
                    }
                );


                //根据店铺编码查店铺指标
                function getStoreKpi() {
                    $scope.storeKpiQuery = {
                        storeCode: $scope.storeCode,
                        type: $rootScope.authUser.userType
                    };

                    storeBiz.getStoreKpi($scope.storeKpiQuery).then(
                        function (result) {
                            if (result.success) {

                                $scope.storeKpi = result.object;
                                //10分钟到店率
                                $scope.arrivalRate = $scope.storeKpi.arrivalRate;
                                //40分钟送达率
                                $scope.backRate = $scope.storeKpi.backRate;

                                //平均订单时长
                                $scope.orderTimeAvg = $scope.storeKpi.orderTimeAvg;

                                //平均取货时长
                                $scope.pickupTimeAvg = $scope.storeKpi.pickupTimeAvg;

                                //平均妥投时长
                                $scope.deliveryTimeAvg = $scope.storeKpi.deliveryTimeAvg;

                                //时效内妥投占比
                                $scope.deliveryInTimeRate = $scope.storeKpi.deliveryInTimeRate;

                                //妥投失效异常单
                                $scope.excptionDeliveryInTime = $scope.storeKpi.excptionDeliveryInTime;

                                //在途订单数量
                                $scope.onTheWayOrder = $scope.storeKpi.onTheWayOrder;

                                //已完成订单量
                                $scope.completedOrder = $scope.storeKpi.completedOrder;

                            } else {
                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                            }

                        },
                        function (errorResult) {
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                        }
                    );
                }


                //获取雇员列表
                function getEmpList() {

                    $scope.empListQuery = {
                        storeCode: $scope.storeCode
                    };

                    $('#storeOrderTable').bootstrapTable('removeAll');

                    storeBiz.getEmpListAndNum($scope.empListQuery).then(
                        function (result) {
                            if (result.success) {

                                //拿到相关配送员列表和配送员的地理信息
                                $scope.empList = result.object;

                                //当前配送人数
                                $scope.atWorkEmpNum = $scope.empList.atWorkEmpNum;
                                //店铺总配送人数
                                $scope.totalEmpNum = $scope.empList.totalEmpNum;
                                $scope.deliveryEmps = $scope.empList.deliveryEmps;//配送员列表


                                for (var i = 0; i < $scope.deliveryEmps.length; i++) {
                                    if ($scope.deliveryEmps[i].status === "驻店") {
                                        //画地图标记
                                       var marker =  new AMap.Marker({
                                            map: $scope.map,
                                            position: [$scope.deliveryEmps[i].lng, $scope.deliveryEmps[i].lat],
                                            icon: new AMap.Icon({
                                                size: new AMap.Size(48, 48),  //图标大小
                                                image: "/images/store_deliveryEmp.png",
                                                imageOffset: new AMap.Pixel(0, 0)
                                            }),
                                            label: {
                                                content:'<div class="mapSan">'+$scope.deliveryEmps[i].name+'</div>',
                                                offset:new AMap.Pixel(2, -22)
                                            }
                                        });

                                        new AMap.Marker({
                                            map: $scope.map,
                                            offset:new AMap.Pixel(-20, 11),
                                            position: [$scope.deliveryEmps[i].lng, $scope.deliveryEmps[i].lat],
                                            content: '<div ><span  class="amap-marker-label span3">'+$scope.deliveryEmps[i].onTheWayOrder+
                                            '</span><span class="amap-marker-label-red span3">'+$scope.deliveryEmps[i].completedOrder+'</span></div>'
                                        });
                                    }


                                }

                                //初始化配送员订单列表
                                reloadStoreOrderTable($scope.deliveryEmps);


                            } else {
                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                            }

                        },
                        function (errorResult) {
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                        }
                    );
                }


                function initProvinceSelect(data) {
                    $('#provinceSelect').select2({
                        data: data,
                        placeholder: '请选择省',
                        language: 'zh-CN',
                        minimumResultsForSearch: Infinity,
                        templateResult: function (repo) {
                            return repo.name;
                        },
                        templateSelection: function (repo) {
                            return repo.name || repo.text
                        },
                        escapeMarkup: function (markup) {
                            return markup;
                        }

                    }).on('select2:select', function (event) {

                        $('#citySelect').empty();
                        $('#citySelect').append($("<option selected>" + $scope.title[1] + "</option>").val(""));
                        $('#citySelect').trigger('change');

                        $('#storeSelect').empty();
                        $('#storeSelect').append($("<option selected>" + $scope.title[2] + "</option>").val(""));
                        $('#storeSelect').trigger('change');

                        var city = [];
                        city.length = 0;
                        var province = $('#provinceSelect').val();

                        $scope.cityList = [];
                        $scope.cityList.length = 0;
                        $scope.cityList = $scope.objectList[province].cities;

                        for (var i = 0; i < $scope.cityList.length; i++) {
                            var cityObject = $scope.cityList[i];

                            var citySelect = {
                                id: i,
                                name: cityObject.cityName
                            };


                            city.push(citySelect);
                        }

                        initCitySelect(city);
                    });

                };


                function initCitySelect(data) {

                    $('#citySelect').select2({
                        placeholder: '请选择市',
                        language: 'zh-CN',
                        minimumResultsForSearch: Infinity,
                        data: data,
                        templateResult: function (repo) {
                            return repo.name;
                        },
                        templateSelection: function (repo) {
                            return repo.name || repo.text
                        },
                        escapeMarkup: function (markup) {
                            return markup;
                        }
                    }).on('select2:select', function (event) {

                        $('#storeSelect').empty();
                        $('#storeSelect').append($("<option selected>" + $scope.title[2] + "</option>").val(""));
                        $('#storeSelect').trigger('change');

                        var store = [];
                        store.length = 0;
                        var city = $('#citySelect').val();

                        $scope.storeList = $scope.cityList[city].stores;

                        for (var i = 0; i < $scope.storeList.length; i++) {
                            var storeObject = $scope.storeList[i];

                            var storeSelect = {
                                id: i,
                                name: storeObject.storeName
                            };


                            store.push(storeSelect);
                        }

                        initStoreSelect(store);

                    });

                }


                function initStoreSelect(data) {
                    $('#storeSelect').select2({
                        placeholder: '请选择店铺',
                        language: 'zh-CN',
                        minimumResultsForSearch: Infinity,
                        data: data,
                        templateResult: function (repo) {
                            return repo.name;
                        },
                        templateSelection: function (repo) {
                            return repo.name || repo.text
                        },
                        escapeMarkup: function (markup) {
                            return markup;
                        }
                    }).on('select2:select', function (event) {

                        var store = $('#storeSelect').val();

                        $scope.pickStore = $scope.storeList[store];

                        //店铺Code
                        $scope.storeCode = $scope.pickStore.storeCode;
                        //店铺名称
                        $scope.storeName = $scope.pickStore.storeName;
                        //城市名称
                        $scope.cityName = $scope.pickStore.cityName;
                        // 纬度
                        $scope.lat = $scope.pickStore.lat;
                        //经度
                        $scope.lng = $scope.pickStore.lng;
                        //城市编码
                        $scope.cityCode = $scope.pickStore.cityCode;
                        //省编码
                        $scope.provinceCode = $scope.pickStore.provinceCode;
                        //省名称
                        $scope.provinceName = $scope.pickStore.provinceName;
                        //店铺地址
                        $scope.storeAddress = $scope.pickStore.storeAddress;

                        //设置地图中心
                        $scope.map.setZoomAndCenter(12, [$scope.lng, $scope.lat]);
                        //function 执行查询店铺kpi,画地图,初始化订单列表

                        initMapPoint();

                        getStoreKpi();

                        getEmpList();


                    });
                }


                //重新加载表格
                function reloadStoreOrderTable(data) {

                    $('#storeOrderTable').bootstrapTable('load', {
                        data: data
                    });
                }


                function initMapPoint() {

                    //删除原先图上的标记
                    $scope.map.clearMap();

                    new AMap.Marker({
                        map: $scope.map,
                        position: [$scope.lng, $scope.lat],
                        icon: new AMap.Icon({
                            size: new AMap.Size(40, 50),  //图标大小
                            image: "/images/store_location.png",
                            imageOffset: new AMap.Pixel(0, 0)
                        })
                    });


                    new AMap.Circle({
                        map: $scope.map,
                        center: new AMap.LngLat($scope.lng, $scope.lat),// 圆心位置
                        radius: 7000, //半径
                        strokeColor: "#4199d0", //线颜色
                        strokeOpacity: 1, //线透明度
                        strokeWeight: 3, //线粗细度
                        fillColor: "#4199d0", //填充颜色
                        fillOpacity: 0.35//填充透明度
                    });
                }


                //查看该收派员的当天订单列表和配送员指标
                $('#empKpiAndOrderModal').on('shown.bs.modal', function () {

                    $scope.empKpiAndOrderQuery = {
                        storeCode: $scope.storeCode,
                        contact: $("input[name='empContact']").val(),
                        resourceId: $("input[name='resourceId']").val()

                    };


                    $('#deliveryEmpOrderListTable').bootstrapTable({
                        columns: [
                            {
                                field: "name",
                                formatter: function () {
                                    return $("input[name='modelEmpName']").val();
                                }
                            },
                            {
                                field: "contact",
                                formatter: function () {
                                    return $("input[name='empContact']").val();
                                }
                            },
                            {
                                field: 'orderNo'
                            },
                            {
                                field: 'endTime',
                                formatter: function (value) {
                                    if (value == null || value == "") {
                                        return null;
                                    } else {
                                        var date = new Date(value);
                                        var Y = date.getFullYear() + '-';
                                        var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
                                        var D = date.getDate() + ' ';
                                        var h = date.getHours() + ':';
                                        var m = date.getMinutes() + ':';
                                        var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
                                        return (Y + M + D + h + m + s);
                                    }

                                }

                            },
                            {
                                field: 'predictEndTime',
                                formatter: function (value) {
                                    var date = new Date(value);
                                    var Y = date.getFullYear() + '-';
                                    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
                                    var D = date.getDate() + ' ';
                                    var h = date.getHours() + ':';
                                    var m = date.getMinutes() + ':';
                                    var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
                                    return (Y + M + D + h + m + s);
                                }

                            },
                            {
                                field: 'status'
                            }]
                    });

                    $scope.empCompletedOrder = $("input[name='empCompletedOrder']").val();
                    $scope.empOnTheWayOrder = $("input[name='empOnTheWayOrder']").val();


                    storeBiz.getDeliveryEmpKpiAndOrders($scope.empKpiAndOrderQuery).then(
                        function (result) {

                            if (result.success) {

                                $scope.empKpiAndOrdersDto = result.object;
                                //10分钟到店率
                                $scope.empArrivalRate = $scope.empKpiAndOrdersDto.arrivalRate;
                                //40分钟送达率
                                $scope.empBackRate = $scope.empKpiAndOrdersDto.backRate;

                                //时效内妥投占比
                                $scope.empDeliveryInTimeRate = $scope.empKpiAndOrdersDto.deliveryInTimeRate;

                                /* $scope.empDeliveryInTimeRate = $scope.empKpiAndOrdersDto.completeRate;*/

                                $scope.empTaskInfos = $scope.empKpiAndOrdersDto.taskInfos;

                                $('#deliveryEmpOrderListTable').bootstrapTable('load', {
                                    data: $scope.empTaskInfos
                                });


                            } else {
                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                            }
                        },
                        function (errorResult) {
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                        }
                    );

                });




                //搜索
                //通过订单号和配送员姓名搜索
                $scope.doSearch = function () {
                    $scope.empAndOrderQuery = {
                        orderNo: $scope.orderNo,
                        empName: $scope.empName,
                        storeCode: $scope.storeCode
                    };

                    storeBiz.getEmpListByOrderNoAndEmpName($scope.empAndOrderQuery).then(
                        function (result) {
                            if (result.success) {

                                //得到配送员列表
                                $scope.deliveryEmpDto = result.object;

                                //获得查询后的配送员订单列表

                                reloadStoreOrderTable($scope.deliveryEmpDto);

                            } else {
                                $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                            }

                        },
                        function (errorResult) {
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                        }
                    );
                };

                //取消按钮
                $scope.doDismiss = function () {
                    $scope.orderNo = "";
                    $scope.empName = "";

                    getEmpList();
                };

            }]);


});

/**
 * 显示订单详情
 * @param orderNo
 */
function showOrder(orderNo) {

    $("input[name='orderDetailNo']").val(orderNo);

    $('#orderDetailModal').modal('show');

}


/**
 * 显示 快递员的 指标和当前订单状况 模态框
 * @param name
 * @param resourceId
 * @param onTheWayOrder
 * @param completedOrder
 */
function showDeliveryEmp(name, contact,resourceId, onTheWayOrder, completedOrder) {

    $("input[name='modelEmpName']").val(name);

    $("input[name='empContact']").val(contact);

    $("input[name='resourceId']").val(resourceId);

    $("input[name='empOnTheWayOrder']").val(onTheWayOrder);

    $("input[name='empCompletedOrder']").val(completedOrder);


    $('#empKpiAndOrderModal').modal('show');

}
