define([
    'angular'
], function (angular) {
    'use strict';
    return angular.module('appBizs.storeBizs', [])
        .service('shopBiz', ['promiseService', 'SystemConfig',
            function (promiseService, SystemConfig) {
                return {
                    shopDetail: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_shopInfo, opts, 'POST');
                    },
                    shopAreas: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_shopAreas, opts, 'POST');
                    },
                    shopProductType: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_productType, opts, 'POST');
                    }
                };
            }
        ])
        .service('storeBiz', ['$http', '$q', '$cookies', '$base64', 'promiseService', 'SystemConfig',
            function ($http, $q, $cookies, $base64, promiseService, SystemConfig) {
                return {
                    getStoreLocation: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_storeList, opts, "POST");
                    },
                    getEmpListByOrderNoAndEmpName: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_empListByOrderNoAndEmpName, opts, "POST");
                    },
                    getDeliveryEmpKpiAndOrders: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_deliveryEmpKpiAndOrders, opts, "POST");
                    },
                    //根据店铺编码查尚未分配订单的数量
                    getUndistributedOrderNum: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_undistributedOrderNum, opts, "POST");
                    },
                    //根据店铺编码查尚未分配订单列表
                    getUndistributedOrderList: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_undistributedOrderList, opts, "POST");
                    },
                    //根据店铺编码,获取店铺指标
                    getStoreKpi: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_storeKpi, opts, "POST");
                    },
                    //通过店铺编码,获取配送员信息
                    getEmpListAndNum: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_empListAndNum, opts, "POST");
                    },
                    //投诉
                    doComplaint: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_complainDeliveryEmp, opts, "POST");

                    },
                    //催单
                    doPress: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_urgeOrders, opts, "POST");
                    },
                    //资源申请
                    doResApplication: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_applyForResource, opts, "POST");
                    },
                    //订单详情
                    getOrderDetail:function (opts) {
                        return promiseService.getPromise(SystemConfig.url_orderDetail, opts, "POST");
                    }
                }
            }]);
});