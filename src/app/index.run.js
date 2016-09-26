(function() {
  /* global _: false */
  'use strict';
  angular
    .module('formioApp')
    .factory('FormioAlerts', [
      '$rootScope',
      function (
        $rootScope
      ) {
        var alerts = [];
        return {
          addAlert: function (alert) {
            alerts.push(alert);
            if(alert.element) {
              angular.element('#form-group-' + alert.element).addClass('has-error');
            }
          },
          getAlerts: function () {
            var tempAlerts = angular.copy(alerts);
            alerts.length = 0;
            alerts = [];
            return tempAlerts;
          },
          warn: function (warning) {
            if(!warning) {
              return;
            }
            this.addAlert({
              type: 'warning',
              message: warning.message || warning
            });

            // Clear old alerts with new alerts.
            $rootScope.alerts = this.getAlerts();
          },
          onError: function (error) {
            var errors = error.hasOwnProperty('errors') ? error.errors : error.data && error.data.errors;
            if(errors && (Object.keys(errors).length || errors.length) > 0) {
              _.each(errors, (function(e) {
                if(e.message || _.isString(e)) {
                  this.addAlert({
                    type: 'danger',
                    message: e.message || e,
                    element: e.path
                  });
                }
              }).bind(this));
            }
            else if (error.message) {
              this.addAlert({
                type: 'danger',
                message: error.message,
                element: error.path
              });
            }

            // Remove error class from old alerts before clearing them.
            _.each($rootScope.alerts, function(alert){
              if(alert.element && !_.find(alerts, 'element', alert.element)) {
                angular.element('#form-group-' + alert.element).removeClass('has-error');
              }
            });
            // Clear old alerts with new alerts.
            $rootScope.alerts = this.getAlerts();
          }
        };
      }
    ])
    .run([
      '$rootScope',
      'AppConfig',
      'Formio',
      'FormioAlerts',
      '$state',
      '$templateCache',
      'FormioUtils',
      function(
        $rootScope,
        AppConfig,
        Formio,
        FormioAlerts,
        $state,
        $templateCache,
        FormioUtils
      ) {
        $rootScope.userLoginForm = AppConfig.appUrl + '/user/login';

        // Set the current user if it isn't provided.
        if (!$rootScope.user) {
          Formio.currentUser().then(function(user) {
            $rootScope.user = user;
          });
        }

        // Ensure they are logged in.
        $rootScope.$on('$stateChangeStart', function(event, toState) {
          $rootScope.authenticated = !!Formio.getToken();
          if (toState.name === 'login') { return; }
          if(!$rootScope.authenticated) {
            event.preventDefault();
            $state.go('login');
          }
        });

        // Adding the alerts capability.
        $rootScope.alerts = [];
        $rootScope.closeAlert = function(index) {
          $rootScope.alerts.splice(index, 1);
        };
        $rootScope.$on('$stateChangeSuccess', function() {
          $rootScope.alerts = FormioAlerts.getAlerts();
        });

        var authError = function() {
          $state.go('home');
          FormioAlerts.addAlert({
            type: 'danger',
            message: 'You are not authorized to perform the requested operation.'
          });
        };

        var logoutError = function() {
          $state.go('login');
          FormioAlerts.addAlert({
            type: 'danger',
            message: 'Your session has expired. Please log in again.'
          });
        };

        $rootScope.$on('formio.sessionExpired', logoutError);
        $rootScope.$on('formio.unauthorized', authError);

        // Logout of form.io and go to login page.
        $rootScope.logout = function() {
          Formio.logout().then(function() {
            $state.go('login');
          }).catch(logoutError);
        };

        // Determine if a state is active.
        $rootScope.isActive = function(state) {
          return $state.current.name.indexOf(state) !== -1;
        };

        $templateCache.put('formio/components/resourcefields.html', FormioUtils.fieldWrap(
          '<formio-component component="resourceSelect" data="data"></formio-component>' +
          '<formio-component ng-if="data.resource" component="propertyField" data="data"></formio-component>' +
          '<fieldset ng-if="data.resource">' +
          '<legend>Resource Fields</legend>' +
          '<div class="well">Below are the fields within the selected resource. For each of these fields, select the corresponding field within this form that you wish to map to the selected Resource.</div>' +
          '<formio-component ng-repeat="resourceComponent in resourceComponents" component="resourceComponent" data="data.fields"></formio-component>' +
          '</fieldset>'
        ));
      }
    ]);
})();
