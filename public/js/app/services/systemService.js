define([
    'angular'
], function (angular) {
    'use strict';
    return angular.module('appBizs.systemBizs', [])
        .factory('promiseService', ['$http', '$q', '$cookies', '$base64', 'SystemConfig',
            function ($http, $q, $cookies, $base64, SystemConfig) {
                return {
                    getPromise: function (url, opts, method) {
                        var deferred = $q.defer();
                        //var defaultOpts = {};
                        var config = opts;//angular.extend({}, defaultOpts, opts);
                        method = (method && method == 'GET') ? 'GET' : 'POST';
                        //$http.defaults.headers.common.ssi_token = $cookies.get('token');
                        $http({
                            method: method,
                            url: SystemConfig.ocs_url + url,
                            data: method == 'POST' ? config : "",
                            params: method == 'GET' ? config : "",
                            headers: {
                                'ocs-client-id': 'O2O-Business-Web',
                                'x-up-Authorization': 'B-Token ' + $base64.encode($cookies.get('B-token'))
                            },
                            timeout: 10000

                        }).success(function (data) {
                            deferred.resolve(data);
                        }).error(function (data, config) {
                            deferred.reject({type: "warning", text: "网络异常", data: data, config: config});
                        });
                        return deferred.promise;
                    }
                };
            }])

        .factory('CacheBiz', [function ($http, $q) {
            return {
                //sessionStorage
                getCacheFromSession: function (key) {
                    var value = window.sessionStorage[key];
                    if (value) {
                        return angular.fromJson(value);
                    }
                    return null;
                },
                setCacheToSession: function (key, value) {
                    window.sessionStorage[key] = angular.toJson(value);
                },
                removeCacheFromSession: function (key) {
                    window.sessionStorage.removeItem(key);
                },
                //localStorage
                getCacheFromLocal: function (key) {
                    var value = window.localStorage[key];
                    if (value) {
                        return angular.fromJson(value);
                    }
                    return null;
                },
                setCacheToLocal: function (key, value) {
                    window.localStorage[key] = angular.toJson(value);
                },
                removeCacheFromLocal: function (key) {
                    window.localStorage.removeItem(key);
                }
            };
        }])

        .factory('ValidateBiz', ['$http', '$q', function ($http, $q) {
            return {
                reg: function (type, value) {
                    var flag = false;
                    var regBox = {
                        regEmail: /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/,//邮箱
                        regName: /^[a-z0-9_-]{3,16}$/,//用户名
                        regMobile: /^0?1[3|4|5|8][0-9]\d{8}$/,//手机
                        regTel: /^0?1[3|4|5|7|8][0-9]\d{8}$|^[\d]{7,8}$/,//手机或固话(无区号) 0[\d]{2,3}
                        reDigit: /^\d+(\.\d+)?$/ //数字
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
                        default :
                            break;
                    }
                    return flag;
                }
            };
        }])
});

