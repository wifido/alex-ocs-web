'use strict';
//默认引用lib中min.js,如果需要调试,请将相应的.min去掉
requirejs.config({
  baseUrl: '/js/lib',
  paths: {
      domReady  : 'domReady/domReady',
      jquery    : 'jquery/jquery.min',
      jqueryUI   : 'jquery-ui/jquery-ui-u.min',
      bootstrap : 'bootstrap/bootstrap.min',
      bootstrapGrowl : 'bootstrap-growl/jquery.bootstrap-growl.min',
      angular   : 'angular/angular.min',
      AdminLTE  : 'AdminLTE/app.min',
      uiRouter  : 'angular-ui-router/angular-ui-router.min',
      slimscroll : 'jquery.slimscroll.min',
      datatable : 'plugins/datatable/jquery.dataTables.min',
      dtBootstrap : 'plugins/datatable/dataTables.bootstrap.min',
      angularCookies : 'angular-cookies/angular-cookies.min',
      angularBase64 : 'angular-base64/angular-base64.min',
      uiDate : 'angular-ui-date/angular-date',
      angularFileUpload : 'angular-file-upload/ng-file-upload.min',
      select2 : 'plugins/select2/select2.full.min',
      select2CN: 'plugins/select2/zh-CN',
      bootstrapTable : 'plugins/table/bootstrap-table.min',
      bootstrapTableCN : 'plugins/table/bootstrap-table-zh-CN'
      // uiBootstrap: 'ui-bootstrap/ui-bootstrap.min'
      // ngTable : 'ng-table/ng-table'
  },
  waitSeconds: 0,
  shim: {
  	 angular   : { exports : 'angular' },
     bootstrap : { deps : [ 'jquery' ] },
     bootstrapGrowl : { deps : [ 'jquery' ] },
     AdminLTE  : { deps : [ 'jquery','bootstrap' ] },
     uiRouter  : { deps : [ 'angular'] },
     slimscroll : { deps : [ 'jquery' ] },
     datatable : {deps : [ 'jquery' ]},
     dtBootstrap : {deps : [ 'datatable', 'bootstrap']},
     angularCookies :{deps : ['angular']},
     angularBase64:{deps : ['angular']},
     angularFileUpload:{deps : ['angular']},
     select2 : { deps : [ 'jquery' ] },
     select2CN:{ deps : [ 'jquery','select2' ]},
     bootstrapTable : { deps : [ 'jquery' ] },
     bootstrapTableCN : { deps : [ 'jquery' ,'bootstrapTable'] }
     // uiBootstrap : { deps : ['bootstrap'] }
     // ngTable : { deps: ['angular'] }
  },
  deps: [
        // kick start application... see bootstrap.js
        //'./boot'
    ]
});

requirejs([
  'jquery',
  'angular',
  'domReady!',
  'jqueryUI',
  'bootstrap',
  'bootstrapGrowl',
  'AdminLTE',
  'slimscroll',
  'datatable',
  'dtBootstrap',
  'select2',
  'select2CN',
  'bootstrapTable',
  'bootstrapTableCN',
  // 'uiBootstrap',
  // 'ngTable',
  '../ocsApp' + version
  ], function($,ng,domReady) {
       ng.bootstrap(document, ['ocsApp']);
  }
);
