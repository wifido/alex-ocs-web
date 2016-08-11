define([
    'angular',
    'uiRouter',
    'uiDate',
    'angularCookies',
    'angularBase64',
    'datatable',
    'angularFileUpload',
    // 'ngTable',
    './app/controllers' + version,
    './app/controllers/orderController' + version,
    './app/controllers/userController' + version,
    './app/controllers/storeController' + version,
    './app/services' + version,
    './app/services/orderService' + version,
    './app/services/storeService' + version,
    './app/services/userService' + version,
    './app/services/systemService' + version,
    './app/directives' + version
], function (angular) {
    'use strict';
    return angular.module('ocsApp', ['appCtrls', 'appBizs', 'appDirs', 'ngCookies', 'ui.router', 'ui.date', 'base64', 'ngFileUpload'])
        .config(
            function ($stateProvider, $urlRouterProvider) {

                //浏览器类型检查,推荐使用Chrome
                $(document).ready(function () {
                    var agent = navigator.userAgent.toLowerCase();
                    var regStr_chrome = /chrome\/[\d.]+/gi;
                    //Chrome
                    if (agent.indexOf("chrome") > 0) {
                        return agent.match(regStr_chrome);
                    } else {
                        $.bootstrapGrowl("建议使用谷歌浏览器", {
                            type: 'danger', // (null, 'info', 'danger', 'success')
                            offset: {from: 'top', amount: 20}, // 'top', or 'bottom'
                            align: 'center', // ('left', 'right', or 'center')
                            width: 500, // (integer, or 'auto')
                            delay: 6000 // Time while the message will be displayed. It's not equivalent to the *demo* timeOut!
                        });
                    }
                });

                //setDefaultPage
                $urlRouterProvider
                    .when('/', 'main')
                    .otherwise('/');

                $stateProvider
                    .state('auth', {
                        url: '/auth',
                        templateUrl: 'html/partials/login.html',
                        controller: 'authCtrl'
                    })
                    .state('main', {
                        url: '/main',
                        templateUrl: 'html/main.html'
                    })
                    .state('main.orderCreate', {
                        url: '/order/create',
                        templateUrl: 'html/partials/orderCreate.html',
                        controller: 'orderCreateCtrl'
                    })
                    .state('main.orderList', {
                        url: '/order/list',
                        templateUrl: 'html/partials/orderList.html',
                        controller: 'orderListCtrl'
                    })
                    .state('changePwd', {
                        url: '/changePwd',
                        templateUrl: 'html/partials/changePwd.html',
                        controller: 'pwdCtrl'
                    })
                    .state('main.storeManager',{
                        url:'/store/storeManager',
                        templateUrl:'html/partials/storeManager.html',
                        controller:'storeManagerCtrl'
                    })
                    .state('main.merChantManager',{
                        url:'/store/merChantManager',
                        templateUrl:'html/partials/merChantManager.html',
                        controller:'merChantManagerCtrl'
                    });
            }
        )
        .provider("$ocsPopup", [function () {
            var ocsPopupPro = {
                okText: 'OK',
                cancelText: 'Cancel',
                template: '',
                templateUrl: '',
                $get: function ($q, $http, $timeout, $compile, $rootScope) {
                    var service = {
                        _appendHtml: function (html, model, element) {
                            if (!element) {
                                $('body').append(html);
                            } else {
                                element.append(html);
                            }
                            var mainEle = null;
                            var maskbox = null;
                            var elements = {'mainEle': {}, 'maskbox': {}};
                            try {
                                if (model.mainEle) {
                                    mainEle = $('.' + model.mainEle).length == 0 ? $('#' + model.mainEle) : $('.' + model.mainEle);
                                    elements.mainEle = mainEle;
                                }
                                if (model.maskbox) {
                                    maskbox = $('.' + model.maskbox).length == 0 ? $('#' + model.maskbox) : $('.' + model.maskbox);
                                    elements.maskbox = maskbox;
                                }
                                if (mainEle.length == 0) {
                                    throw new Error('mainEle or maskbox can not creat, please check them!');
                                }
                            } catch (e) {
                                console.error(e.name + ":" + e.message);
                            }
                            return elements;
                        },

                        _showHtml: function (elements) {
                            elements.mainEle.show();
                            elements.maskbox.show();
                        },

                        _hideHtml: function (elements) {
                            elements.mainEle.remove();
                            elements.maskbox.remove();
                        },

                        _run: function (html, model, callback) {
                            var elements = service._appendHtml(html, model);
                            service._showHtml(elements);
                            $timeout(function () {
                                elements.mainEle.find("#a_ok").click(function () {
                                    service._hideHtml(elements);
                                    callback(true);
                                    $rootScope.$apply();
                                });
                                elements.mainEle.find("#a_cancel").click(function () {
                                    service._hideHtml(elements);
                                    callback(false);
                                    $rootScope.$apply();
                                });
                                elements.mainEle.find("#em_cancel").click(function () {
                                    service._hideHtml(elements);
                                    callback(false);
                                    $rootScope.$apply();
                                });
                            }, 1);
                        },

                        growl: function (content, opts) {
                            content = !content ? "数据出错" : content;
                            var defaultOpts = {
                                type: 'null', // (null, 'info', 'danger', 'success')
                                offset: {from: 'top', amount: 20}, // 'top', or 'bottom'
                                align: 'center', // ('left', 'right', or 'center')
                                width: 300, // (integer, or 'auto')
                                delay: 3000 // Time while the message will be displayed. It's not equivalent to the *demo* timeOut!
                            };
                            var config = angular.extend({}, defaultOpts, opts);
                            $.bootstrapGrowl(content, config);
                        },

                        showLoading: function (loading, element) {
                            var html = '<div id="loading" class="loading">Loading...</div>';
                            var elements = {mainEle: $(".loading"), maskbox: $("#null")};
                            if (loading) {
                                elements = service._appendHtml(html, {mainEle: "loading", maskbox: "null"}, element);
                                service._showHtml(elements);
                            } else {
                                service._hideHtml(elements);
                            }
                        },

                        confirm: function (opts) {
                            var deferred = $q.defer();
                            var defaultOpts = {
                                templateUrl : 'js/app/template/confirm.html',
                                container : 'body',
                                id : 'confirmModal',
                                scope : $rootScope,
                                tittle : '操作提示',
                                content : '确认要这样吗',
                                okText : '确认',
                                cancelText : '取消'
                            };
                            var config = angular.extend({}, defaultOpts, opts);
                            var idStr = '#' + config.id;
                            $(idStr).remove(); //每次都必须生成新modal
                            $http.get(config.templateUrl).success(function (template) {
                                if (defaultOpts.id == config.id) {
                                    config.scope.tittle = config.tittle;
                                    config.scope.okText = config.okText;
                                    config.scope.cancelText = config.cancelText;
                                    config.scope.content = config.content;
                                }
                                var $template = $compile(template)(config.scope);
                                $(config.container).append($template);
                                $(idStr).modal('show');
                                //注册点击事件
                                $timeout(function () {
                                    $(idStr).find("#btn_ok").click(function () {
                                        deferred.resolve(true);
                                        $('#' + config.id).modal('hide');
                                        config.scope.$apply();
                                    });
                                    $(idStr).find("#btn_cancel").click(function () {
                                        deferred.resolve(false);
                                        $('#' + config.id).modal('hide');
                                        config.scope.$apply();
                                    });
                                }, 1);
                            });
                            return deferred.promise;
                        },

                        showModal: function (opts) {
                            var deferred = $q.defer();
                            var defaultOpts = {
                                templateUrl : 'js/app/template/modal.html',
                                container : 'body',
                                id : 'commonModal',
                                scope : $rootScope,
                                tittle : '',
                                content : ''
                            };
                            var config = angular.extend({}, defaultOpts, opts);
                            var idStr = '#' + config.id;
                            $(idStr).remove(); //每次都必须生成新modal
                            $http.get(config.templateUrl).success(function (template) {
                                if (defaultOpts.id == config.id) {
                                    config.scope.tittle = config.tittle;
                                    config.scope.content = config.content;
                                }
                                var $template = $compile(template)(config.scope);
                                $(config.container).append($template);
                                $(idStr).modal('show');
                                deferred.resolve(true);
                            });
                            return deferred.promise;
                        }
                    };
                    return {
                        growl: service.growl,
                        showLoading: service.showLoading,
                        confirm: service.confirm,
                        showModal: service.showModal
                    };
                }
            };
            return ocsPopupPro;
        }])
        .factory('dupSubmitInterceptor', ['$q', '$rootScope', 'SystemConfig', function ($q, $rootScope, SystemConfig) {
            var reqFilter = function (url) {
                var flag = false;
                for (var key in SystemConfig.urlSet) {
                    var obj = SystemConfig.urlSet[key];
                    if (url.indexOf(key) >= 0 && obj && obj.async) {
                        if (obj.reqStatus) {
                            obj.reqStatus = !obj.reqStatus;
                            SystemConfig.urlSet[key] = obj;
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
            var rspFilter = function (url) {
                for (var key in SystemConfig.urlSet) {
                    if (url.indexOf(key) >= 0) {
                        var obj = SystemConfig.urlSet[key];
                        if (obj.async && !obj.reqStatus) {
                            obj.reqStatus = !obj.reqStatus;
                            SystemConfig.urlSet[key] = obj;
                        }
                    }
                }
            };
            var dupSubmitInterceptor = {
                'request': function (req) {
                    var deferred = $q.defer();
                    if (reqFilter(req.url)) {
                        deferred.resolve(req);
                    }
                    return deferred.promise;
                },
                'response': function (rsp) {
                    rspFilter(rsp.config.url);
                    return $q.when(rsp);
                },
                'responseError': function (rejection) {
                    var deferred = $q.defer();
                    rspFilter(rejection.config.url);
                    var httpStatus = rejection.status;
                    if (rejection.config.url.indexOf('authc/login') != '-1') {
                        return $q.reject(rejection);
                    }
                    if (403 == httpStatus || 401 == httpStatus) {
                        $rootScope.errorReturn('auth', '登陆超时，请重新登陆');
                        return $q.reject(rejection);
                    } else {
                        return $q.reject(rejection);
                    }
                    if (rejection.data) {
                        deferred.resolve(rejection);
                    } else {
                        deferred.reject(rejection);
                    }
                    return deferred.promise;
                }
            };
            return dupSubmitInterceptor;
        }])
        .config(['$httpProvider',
            function ($httpProvider) {
                $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
                var param = function (obj) {
                    var query = '',
                        name, value, fullSubName, subName, subValue, innerObj, i;
                    for (name in obj) {
                        value = obj[name];
                        if (value instanceof Array) {
                            for (i = 0; i < value.length; ++i) {
                                subValue = value[i];
                                fullSubName = name + '[' + i + ']';
                                innerObj = {};
                                innerObj[fullSubName] = subValue;
                                query += param(innerObj) + '&';
                            }
                        } else if (value instanceof Object) {
                            for (subName in value) {
                                subValue = value[subName];
                                fullSubName = name + '[' + subName + ']';
                                innerObj = {};
                                innerObj[fullSubName] = subValue;
                                query += param(innerObj) + '&';
                            }
                        } else if (value !== undefined && value !== null) {
                            query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
                        }
                    }
                    return query.length ? query.substr(0, query.length - 1) : query;
                };
                $httpProvider.defaults.transformRequest = [function (data) {
                    return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
                }];
                //重复请求拦截器:需要返回结果后才能继续发送请求
                $httpProvider.interceptors.push('dupSubmitInterceptor');
            }]
        )
        .value('SystemConfig', {
            ocs_url: 'https://o2o.sit.sf-express.com:14443/api', //uat
            // ocs_url: 'https://o2o.sf-express.com:443/api', //production
            url_template_download: 'https://o2o.sit.sf-express.com:14443/js/lib/orderDownload.xls', //uat
            // url_template_download: 'https://o2o.sf-express.com:443/js/lib/orderDownload.xls', //production
            url_print: 'https://o2o.sit.sf-express.com:14443/html/build/print' + version + '.html', //uat
            // url_print: 'https://o2o.sf-express.com:443/html/build/print.html', //production
            url_auth: '/authc/login',
            url_changePwd: '/authc/changePwd',
            url_orderList: '/order/list',
            url_orderDetail: '/order/detail',
            url_createOrder: '/order/placeOrder',
            url_batchCreateOrder: '/order/batchPlaceOrder',
            url_printOrderList: '/order/print',
            url_modifyOrderAddress: '/order/modifyOrderAddress',
            url_cancelOrder: '/order/cancel',
            url_shopInfo: '/shop/detail',
            url_shopAreas: '/shop/areas',
            url_productType: '/shop/productTypes',
            url_complainDeliveryEmp: '/majorAccount/deliveryEmp/complain',
            url_applyForResource:'/majorAccount/applyForResource',
            url_urgeOrders:'/majorAccount/urgeOrders',
            url_empListAndNum:'/majorAccount/empListAndNum',
            url_empListByOrderNoAndEmpName:'/majorAccount/empList',
            url_storeList:'/majorAccount/storeList',
            url_storeKpi:'/majorAccount/storeKpi',
            url_undistributedOrderNum:'/majorAccount/undistributedOrderNum',
            url_undistributedOrderList:'/majorAccount/undistributedOrderList',
            url_deliveryEmpKpiAndOrders:'/majorAccount/deliveryEmp/kpiAndOrders',
            urlSet: {
                //async:异步请求拦截开关,reqStatus:请求状态,mask:加载loading是否显示
                "/authc/login": {"async": true, "reqStatus": true, "mask": false},
                "/authc/changePwd": {"async": true, "reqStatus": true, "mask": false},
                "/order/list": {"async": true, "reqStatus": true, "mask": false},
                "/order/detail": {"async": true, "reqStatus": true, "mask": false},
                "/order/placeOrder": {"async": true, "reqStatus": true, "mask": false},
                "/order/batchPlaceOrder": {"async": true, "reqStatus": true, "mask": false},
                "/order/print": {"async": true, "reqStatus": true, "mask": false},
                "/order/modifyOrderAddress": {"async": true, "reqStatus": true, "mask": false},
                "/order/cancel": {"async": true, "reqStatus": true, "mask": false},
                "/shop/detail": {"async": true, "reqStatus": true, "mask": false},
                "/shop/areas": {"async": true, "reqStatus": true, "mask": false},
                "/shop/productTypes": {"async": true, "reqStatus": true, "mask": false},
                "/majorAccount/deliveryEmp/complain": {"async": true, "reqStatus": true, "mask": false},
                "/majorAccount/applyForResource": {"async": true, "reqStatus": true, "mask": false},
                "/majorAccount/urgeOrders": {"async": true, "reqStatus": true, "mask": false},
                "/majorAccount/empListAndNum": {"async": true, "reqStatus": true, "mask": false},
                "/majorAccount/empList": {"async": true, "reqStatus": true, "mask": false},
                "/majorAccount/storeList": {"async": true, "reqStatus": true, "mask": false},
                "/majorAccount/storeKpi": {"async": true, "reqStatus": true, "mask": false},
                "/majorAccount/undistributedOrderNum": {"async": true, "reqStatus": true, "mask": false},
                "/majorAccount/undistributedOrderList": {"async": true, "reqStatus": true, "mask": false},
                "/majorAccount/deliveryEmp/kpiAndOrders": {"async": true, "reqStatus": true, "mask": false}
            },
            orderInfo: 'orderInfo',
            // 权限角色
            userRole: {
                business_important : 'ROLE_BUSINESS_IMPORTANT', // 中高端商家总部(管理)
                store_important : 'ROLE_STORE_IMPORTANT', // 中高端商家门店
                business_normal : 'ROLE_BUSINESS_NORMAL', // 普通商家(管理)
                store_normal : 'ROLE_STORE_NORMAL', // 普通商家门店
                other : 'ROLE_OTHER'
            },
            // 角色路由映射
            userRoleRouteMap: {
                'ROLE_BUSINESS_IMPORTANT': ['main', 'main.merChantManager'],
                'ROLE_STORE_IMPORTANT': ['main', 'main.orderCreate', 'main.orderList', 'main.storeManager'],
                'ROLE_BUSINESS_NORMAL': ['main'],
                'ROLE_STORE_NORMAL': ['main', 'main.orderCreate', 'main.orderList'],
                'ROLE_OTHER' : ['main']
            },
            // 角色按钮映射(小粒度)
            userRoleButtonMap: {
                'ROLE_BUSINESS_IMPORTANT': ['modifyAddress'],
                'ROLE_STORE_IMPORTANT': ['modifyAddress'],
                'ROLE_BUSINESS_NORMAL': ['modifyAddress', 'cancelOrder'],
                'ROLE_STORE_NORMAL': ['modifyAddress', 'cancelOrder'],
                'ROLE_OTHER' : []
            }
        })
        .run(['$rootScope', '$cookies', '$state', '$ocsPopup', 'authBiz', function ($rootScope, $cookies, $state, $ocsPopup, authBiz) {
            $rootScope.authUser = angular.fromJson($cookies.get('authUser'));
            $rootScope.logout = function () {
                $cookies.remove('authUser', {path: "/"});
                $cookies.remove('B-token', {path: "/"});
                $cookies.remove('userRole', {path: "/"});
                $rootScope.authUser = null;
                $state.go("auth");//跳转到登录界面
            };

            $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
                if (toState.name == 'auth' || toState.name == 'changePwd')return;// 如果是进入登录界面则允许
                // 如果用户不存在
                if (!$rootScope.authUser) {
                    event.preventDefault();// 取消默认跳转行为
                    $state.go("auth");//跳转到登录界面
                }
                // 权限控制:阻止无权限用户通过路由访问
                var authUser = angular.fromJson($cookies.get('authUser'));
                if (!authUser) {
                    $cookies.remove('userRole', {path: "/"});
                }
                var role = $cookies.get('userRole');
                if (role) {
                    if (!authBiz.isRouteStateAccessibleForUser(role, toState.name)) {
                        event.preventDefault();// 取消默认跳转行为
                        $state.go("auth");
                        $ocsPopup.growl("无访问权限", {type: 'danger'});
                    }
                }
            });

            $rootScope.errorReturn = function (state, content) {
                // alert(content);
                $state.go(state);
            };
        }]);
});


