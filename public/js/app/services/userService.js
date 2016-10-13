define([
    'angular'
], function (angular) {
    'use strict';
    return angular.module('appBizs.userBizs', [])
        .service('authBiz', ['$http', '$q', '$cookies', '$base64', '$state', 'promiseService', 'SystemConfig',
            function ($http, $q, $cookies, $base64, $state, promiseService, SystemConfig) {
                return {
                    auth: function (opts) {
                        var deferred = $q.defer();
                        var config = {
                            method: 'POST',
                            url: SystemConfig.ocs_url + SystemConfig.url_auth,
                            headers: {
                                'ocs-client-id': 'O2O-Business-Web',
                                'x-up-Authorization': 'B-Token ' + $base64.encode(opts.username + ':' + opts.password)
                            },
                            timeout: 10000
                        };
                        $http(config).success(function (data) {
                            if (data != 'login error') {
                                var expireDate = new Date();
                                expireDate.setDate(expireDate.getDate() + 1);
                                $cookies.put('B-token', data, {'expires': expireDate});
                                $cookies.put('E-token', $base64.encode(data));
                                deferred.resolve(data);
                            } else {
                                deferred.reject({
                                    type: "warning",
                                    text: data == 'login error' ? '账号或密码错误' : '网络异常',
                                    data: data,
                                    config: config
                                });
                            }
                        }).error(function (data, status, header, config) {
                            deferred.reject({
                                type: "warning",
                                text: data == 'login error' ? '账号或密码错误' : '网络异常',
                                data: data,
                                config: config
                            });
                        });
                        return deferred.promise;
                    },
                    changePwd: function (opts) {
                        return promiseService.getPromise(SystemConfig.url_changePwd, opts, "POST");
                    },
                    userHasRole: function (role) {
                        var userRole = SystemConfig.userRole;
                        for (var key in userRole) {
                            if (role == userRole[key]) {
                                return true;
                            }
                        }
                        return false;
                    },
                    isRouteStateAccessibleForUser: function (role, routeState) {
                        var userRole = SystemConfig.userRole;
                        var userRoleRouteMap = SystemConfig.userRoleRouteMap;
                        for (var key in userRole) {
                            if (role == userRole[key]) {
                                var validRouteStatesForRole = userRoleRouteMap[role];
                                if (validRouteStatesForRole) {
                                    for (var j = 0; j < validRouteStatesForRole.length; j++) {
                                        if (validRouteStatesForRole[j] == routeState)
                                            return true;
                                    }
                                }
                            }
                        }
                        return false;
                    },
                    isButtonAccessibleForUser: function (role, button) {
                        var userRole = SystemConfig.userRole;
                        var userRoleButtonMap = SystemConfig.userRoleButtonMap;
                        for (var key in userRole) {
                            if (role == userRole[key]) {
                                var validButtonForRole = userRoleButtonMap[role];
                                if (validButtonForRole) {
                                    for (var j = 0; j < validButtonForRole.length; j++) {
                                        if (validButtonForRole[j] == button)
                                            return true;
                                    }
                                }
                            }
                        }
                        return false;
                    },
                    goMainStateByRole: function (role) {
                        var userRole = SystemConfig.userRole;
                        switch (role) {
                            case userRole.business_important:
                                $state.go('main.merChantManager');
                                break;
                            case userRole.store_important:
                                $state.go('main.orderCreate');
                                break;
                            case userRole.business_normal:
                                $state.go('main.orderCreate');
                                break;
                            case userRole.store_normal:
                                $state.go('main.orderCreate');
                                break;
                        }
                    }
                }
            }])
});