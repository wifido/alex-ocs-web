define([
    'angular'
], function (angular) {
    'use strict';
    return angular.module('appBizs.orderBizs', [])
        .service('orderBiz', ['promiseService', 'SystemConfig', 'Upload', '$base64', '$q', '$cookies',
            function (promiseService, SystemConfig, Upload, $base64, $q, $cookies) {
                return {
                    getOrderList: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_orderList, opts, 'POST');
                    },
                    getOrderDetail: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_orderDetail, opts, 'POST');
                    },
                    createOrder: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_createOrder, opts, 'POST');
                    },
                    batchPlaceOrder: function (opts) {
                        //(AngularJs使用ngFileUpload指令实现文件上传
                        // Content-Type需要设置成undefined,让浏览器帮助我们定义Content-Type.
                        // from http://uncorkedstudios.com/blog/multipartformdata-file-upload-with-angularjs
                        var deferred = $q.defer();
                        Upload.http({
                            url: SystemConfig.ocs_url + SystemConfig.url_batchCreateOrder,
                            headers: {
                                'ocs-client-id': 'O2O-Business-Web',
                                'x-up-Authorization': 'B-Token ' + $base64.encode($cookies.get('B-token')),
                                'Content-Type': undefined
                            },
                            data: opts,
                            transformRequest: angular.identity
                        }).progress(function (evt) {
                            deferred.notify(evt);
                        }).success(function (data, status, headers, config) {
                            deferred.resolve(data);
                        }).error(function (data, status, headers, config) {
                            deferred.reject(data);
                        });
                        return deferred.promise;
                    },
                    getPrintOrderList: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_printOrderList, opts, 'POST');
                    },
                    modifyOrderAddress: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_modifyOrderAddress, opts, 'POST');
                    },
                    cancelOrder: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_cancelOrder, opts, 'POST');
                    }
                };
            }])
});

