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
                getCache: function (key) {
                    var value = window.sessionStorage[key];
                    if (value) {
                        return angular.fromJson(value);
                    }
                    return null;
                },
                setCache: function (key, value) {
                    window.sessionStorage[key] = angular.toJson(value);
                },
                removeCache: function (key) {
                    window.sessionStorage.removeItem(key);
                }
            };
        }])
});

