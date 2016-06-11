(function() {
  'use strict';
  angular
    .module('formioApp')
    .config([
      'AppConfig',
      'FormioProvider',
      function(
        AppConfig,
        FormioProvider
      ) {
        FormioProvider.setAppUrl(AppConfig.appUrl);
        FormioProvider.setBaseUrl(AppConfig.apiUrl);
      }
    ]);
})();
