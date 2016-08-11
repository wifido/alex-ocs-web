define([
    'angular'
], function (angular) {
    'use strict';
    return angular.module('appBizs', ['appBizs.userBizs', 'appBizs.orderBizs', 'appBizs.systemBizs', 'appBizs.storeBizs'])
});