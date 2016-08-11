define([
        'angular'
    ], function (angular) {
        'use strict';

        angular.module('appDirs', [])
            .directive('pwCheck', function () {
                return {
                    require: 'ngModel',
                    link: function (scope, elem, attrs, ctrl) {
                        var firstPassword = '#' + attrs.pwCheck;
                        $(elem).add(firstPassword).on('keyup', function () {
                            scope.$apply(function () {
                                var v = elem.val() === $(firstPassword).val();
                                ctrl.$setValidity('pwmatch', v);
                            });
                        });
                    }
                }
            })
            .directive('ocsProgress', ['SystemConfig', function (SystemConfig) {
                return {
                    restrict: 'EA',
                    scope: false,
                    replace: true,
                    templateUrl: 'js/app/template/progress.html',
                    link: function (scope, element, attrs, ngModelController) {
                        if (attrs.percent) {
                            //进度条百分率
                            scope.percent = attrs.percent;
                        }
                    }
                }
            }])
            .directive('ocsDataTable', ['SystemConfig', '$compile', '$http', 'authBiz', function (SystemConfig, $compile, $http, authBiz) {
                return {
                    restrict: 'EA',
                    scope: {
                        tableObj: "=tableObj"
                    },
                    replace: true,
                    link: function (scope, element, attrs, ngModelController) {
                        var defaultParams = {
                            id : "", //id,用于选择主元素
                            columns : [], //表格列格式
                            clickRowCallback : function () {}, //普通点击行回调函数
                            expandRowCallback : function () {}, //扩展点击回调函数,如点击详细图标展开详细页面的时触发
                            accessControlCallback : "", //权限控制方法
                            templateUrl : "" //模板url,模板可默认放置在 js/app/template/ 下
                        };
                        scope.$watch('tableObj', function (newValue, oldValue, scope) {
                            if(scope.tableObj.id) {
                                var dataTableParams = angular.extend({}, defaultParams, scope.tableObj);
                                $http.get(dataTableParams.templateUrl).success(function(template) {
                                    var $template = $compile(template)(scope);
                                    element.append($template);
                                    if (typeof scope.tableObj.accessControlCallback == 'function') {
                                        scope.tableObj.accessControlCallback();
                                    }
                                    var dataTable = $('#' + dataTableParams.id).bootstrapTable({
                                        columns: dataTableParams.columns
                                    });
                                    dataTable.on("click-row.bs.table", dataTableParams.clickRowCallback);
                                    dataTable.on('expand-row.bs.table', dataTableParams.expandRowCallback);
                                });
                            }
                        });
                    }
                }
            }])
            .directive('ocsAccess', ['$cookies', 'authBiz', 'SystemConfig', function ($cookies, authBiz, SystemConfig) {
                return {
                    restrict: 'EA',
                    scope: false,
                    replace: true,
                    templateUrl: 'js/app/template/access.html',
                    link: function (scope, element, attrs, ngModelController) {
                        scope.normal = false; // 订单管理
                        scope.nStore = false; // 订单录入和列表
                        scope.important = false; // 门店管理
                        scope.iStore = false; // 店铺管理
                        scope.merChant = false; // 运力管理
                        var role = $cookies.get('userRole');
                        var userRole = SystemConfig.userRole;
                        if (authBiz.userHasRole(role)) {
                            switch (role) {
                                case userRole.business_important:
                                    // scope.normal = true;
                                    // scope.nStore = true;
                                    scope.important = true;
                                    scope.merChant = true;
                                    break;
                                case userRole.store_important:
                                    scope.normal = true;
                                    scope.nStore = true;
                                    scope.important = true;
                                    scope.iStore = true;
                                    break;
                                case userRole.business_normal:
                                    break;
                                case userRole.store_normal:
                                    scope.normal = true;
                                    scope.nStore = true;
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                }
            }]);

    }
);