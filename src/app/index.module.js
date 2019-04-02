(function() {
  'use strict';
  angular
    .module('formioApp', [
      'ngSanitize',
      'ui.router',
      'ui.bootstrap',
      'ui.bootstrap.accordion',
      'ui.bootstrap.alert',
      'ngFormioHelper',
      'ngFormBuilderHelper',
      'bgf.paginateAnything',
      'formio',
      'ngMap'
    ]);
})();
