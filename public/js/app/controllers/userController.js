define([
    'angular'
], function (angular) {
    'use strict';
    return angular.module('appCtrls.userCtrls', [])
        //认证与登陆
        .controller('authCtrl', ['$scope', '$state', '$rootScope', '$cookies', 'authBiz', 'shopBiz', '$ocsPopup', 'SystemConfig',
            function ($scope, $state, $rootScope, $cookies, authBiz, shopBiz, $ocsPopup, SystemConfig) {
                $scope.user = {
                    password: '',
                    username: ''
                };
                $scope.auth = function () {
                    if (!$scope.user.username) {
                        $ocsPopup.growl("请输入用户名", {type: 'danger'});
                        $("#username")[0].focus();
                        return;
                    }
                    if (!$scope.user.password) {
                        $ocsPopup.growl("请输入密码", {type: 'danger'});
                        $("#password")[0].focus();
                        return;
                    }
                    authBiz.auth($scope.user).then(
                        function (result) {
                            $rootScope.authUser = result;
                            shopBiz.shopDetail(null).then(
                                function (result) {
                                    if (result.success) {
                                        $rootScope.authUser = result.object;
                                        var expireDate = new Date();
                                        expireDate.setDate(expireDate.getDate() + 7);
                                        $cookies.put('authUser', angular.toJson(result.object), {'expires': expireDate});
                                        //权限控制
                                        var userType = $rootScope.authUser.userType; //类别: 1:店铺 0:商家
                                        var levelType = $rootScope.authUser.levelType; //类别: 1:普通 2:中高端
                                        if (userType == 0 && levelType == 2) {
                                            $cookies.put('userRole', SystemConfig.userRole.business_important, {'expires': expireDate});
                                        } else if (userType == 1 && levelType == 2) {
                                            $cookies.put('userRole', SystemConfig.userRole.store_important, {'expires': expireDate});
                                        } else if (userType == 0 && levelType == 1) {
                                            $cookies.put('userRole', SystemConfig.userRole.business_normal, {'expires': expireDate});
                                        } else if (userType == 1 && levelType == 1) {
                                            $cookies.put('userRole', SystemConfig.userRole.store_normal, {'expires': expireDate});
                                        } else {
                                            $cookies.put('userRole', SystemConfig.userRole.other, {'expires': expireDate});
                                            $ocsPopup.growl("该用户未分配任何权限", {type: 'danger'});
                                        }
                                        authBiz.goMainStateByRole($cookies.get('userRole'));
                                    } else {
                                        $ocsPopup.growl(result.errorInfo, {type: 'danger'});
                                    }
                                }, function (errorResult) {
                                    $ocsPopup.growl(errorResult.text, {type: 'danger'});
                                }
                            );
                        }, function (errorResult) {
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                        }
                    );
                };
            }
        ])
        //密码修改
        .controller('pwdCtrl', ['$scope', '$state', '$rootScope', '$cookies', 'authBiz', '$ocsPopup',
            function ($scope, $state, $rootScope, $cookies, authBiz, $ocsPopup) {
                // 修改密码
                $scope.query = {
                    username: '',
                    originPass: '',
                    newPass: ''
                };
                $scope.newPassConfirm = '';
                $scope.changePwd = function () {
                    if (!$scope.query.username) {
                        $ocsPopup.growl("请输入用户名", {type: 'danger'});
                        $("#username")[0].focus();
                        return;
                    }
                    if (!$scope.query.originPass) {
                        $ocsPopup.growl("请输入旧密码", {type: 'danger'});
                        $("#originPass")[0].focus();
                        return;
                    }
                    if (!$scope.query.newPass) {
                        $ocsPopup.growl("请输入新密码", {type: 'danger'});
                        $("#newPass")[0].focus();
                        return;
                    }
                    if ($scope.query.originPass == $scope.query.newPass) {
                        $ocsPopup.growl("新密码不可与旧密码一样", {type: 'danger'});
                        $scope.query.newPass = '';
                        $scope.newPassConfirm = '';
                        $("#newPass")[0].focus();
                        return;
                    }
                    if (!verifyPassword($scope.query.newPass)) {
                        $ocsPopup.growl("新密码必须由6-10位字母、数字、特殊符号组成", {type: 'danger'});
                        $scope.query.newPass = '';
                        $scope.newPassConfirm = '';
                        $("#newPass")[0].focus();
                        return;
                    }
                    if (!$scope.newPassConfirm) {
                        $ocsPopup.growl("请确认新密码", {type: 'danger'});
                        $("#newPassConfirm")[0].focus();
                        return;
                    }
                    if ($scope.query.newPass != $scope.newPassConfirm) {
                        $ocsPopup.growl("请确认正确的新密码", {type: 'danger'});
                        $scope.newPassConfirm = '';
                        $("#newPassConfirm")[0].focus();
                        return;
                    }
                    authBiz.changePwd($scope.query).then(
                        function (result) {
                            if (result.success) {
                                $ocsPopup.growl('修改密码成功,请重新登录', {type: 'success'});
                                $rootScope.logout();
                            } else {
                                $ocsPopup.growl('旧密码错误，请重新输入', {type: 'danger'});
                                $scope.query.newPass = '';
                                $scope.query.originPass = '';
                                $scope.newPassConfirm = '';
                                $("#originPass")[0].focus();
                            }
                        }, function (errorResult) {
                            $ocsPopup.growl(errorResult.text, {type: 'danger'});
                        }
                    );
                    function verifyPassword(obj) {
                        return /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[~!@#$%^&*()_+`\-={}:";'<>?,.\/]).{6,10}$/.test(obj);
                    }
                };
            }
        ])
});
