(function() {
  'use strict';

  angular
    .module('formioAppTodo')
    .run([
      '$rootScope',
      'AppConfig',
      'Formio',
      '$state',
      function(
        $rootScope,
        AppConfig,
        Formio,
        $state
      ) {
        $rootScope.userLoginForm = AppConfig.appUrl + '/user/login';
        $rootScope.userRegisterForm = AppConfig.appUrl + '/user/register';
        $rootScope.todoForm = AppConfig.appUrl + '/todo';

        // Set the current user if it isn't provided.
        if (!$rootScope.user) {
          Formio.currentUser().then(function(user) {
            $rootScope.user = user;
          });
        }

        // Ensure they are logged in.
        $rootScope.$on('$stateChangeStart', function(event, toState) {
          $rootScope.authenticated = !!Formio.getToken();
          if (toState.name.substr(0, 4) === 'auth') { return; }
          if(!$rootScope.authenticated) {
            event.preventDefault();
            $state.go('auth.login');
          }
        });

        var authError = function() {
          $state.go('home');
        };

        var logoutError = function() {
          $state.go('auth.login');
        };

        $rootScope.$on('formio.sessionExpired', logoutError);
        $rootScope.$on('formio.unauthorized', authError);

        // Logout of form.io and go to login page.
        $rootScope.logout = function() {
          Formio.logout().then(function() {
            $state.go('auth.login');
          }).catch(logoutError);
        };

        // Determine if a state is active.
        $rootScope.isActive = function(state) {
          return $state.current.name.indexOf(state) !== -1;
        };
      }
    ]);
})();
