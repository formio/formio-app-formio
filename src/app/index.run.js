(function() {
  'use strict';
  angular
    .module('formioApp')
    .run([
      '$rootScope',
      'AppConfig',
      'Formio',
      'FormioAuth',
      function(
        $rootScope,
        AppConfig,
        Formio,
        FormioAuth
      ) {
        // Initialize the Form.io authentication system.
        FormioAuth.init();

        // Example of overriding templates.
        Formio.Templates.framework = 'bootstrap3';

        // Add the forms to the root scope.
        angular.forEach(AppConfig.forms, function(url, form) {
          $rootScope[form] = url;
        });
      }
    ]);
})();
