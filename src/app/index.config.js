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
        FormioProvider.setBaseUrl(AppConfig.apiUrl);
      }
    ]);
})();
