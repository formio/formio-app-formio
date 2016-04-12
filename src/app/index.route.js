(function() {
  /* global _: false */
  'use strict';
  angular
    .module('formioApp')
    .constant('SubmissionAccessLabels', {
      'read_all': {
        label: 'Read All Submissions',
        tooltip: 'The Read All Submissions permission will allow a user, with one of the given Roles, to read a Submission, regardless of who owns the Submission.'
      },
      'update_all': {
        label: 'Update All Submissions',
        tooltip: 'The Update All Submissions permission will allow a user, with one of the given Roles, to update a Submission, regardless of who owns the Submission. Additionally with this permission, a user can change the owner of a Submission.'
      },
      'delete_all': {
        label: 'Delete All Submissions',
        tooltip: 'The Delete All Submissions permission will allow a user, with one of the given Roles, to delete a Submission, regardless of who owns the Submission.'
      },
      'create_own': {
        label: 'Create Own Submissions',
        tooltip: 'The Create Own Submissions permission will allow a user, with one of the given Roles, to create a Submission. Upon creating the Submission, the user will be defined as its owner.'
      },
      'read_own': {
        label: 'Read Own Submissions',
        tooltip: 'The Read Own Submissions permission will allow a user, with one of the given Roles, to read a Submission. A user can only read a Submission if they are defined as its owner.'
      },
      'update_own': {
        label: 'Update Own Submissions',
        tooltip: 'The Update Own Submissions permission will allow a user, with one of the given Roles, to update a Submission. A user can only update a Submission if they are defined as its owner.'
      },
      'delete_own': {
        label: 'Delete Own Submissions',
        tooltip: 'The Delete Own Submissions permission will allow a user, with one of the given Roles, to delete a Submission. A user can only delete a Submission if they are defined as its owner.'
      }
    })
    .directive('permissionEditor', [
      '$q',
      'SubmissionAccessLabels',
      function(
        $q,
        SubmissionAccessLabels
      ) {
        var PERMISSION_TYPES = [
          'create_all',
          'read_all',
          'update_all',
          'delete_all',
          'create_own',
          'read_own',
          'update_own',
          'delete_own'
        ];

        return {
          scope: {
            roles: '=',
            permissions: '=',
            waitFor: '='
          },
          restrict: 'E',
          templateUrl: 'views/form/permission/editor.html',
          link: function($scope) {
            // Fill in missing permissions / enforce order
            ($scope.waitFor || $q.when()).then(function(){
              var tempPerms = [];
              _.each(PERMISSION_TYPES, function(type) {
                var existingPerm = _.find($scope.permissions, {type: type});
                tempPerms.push(existingPerm || {
                    type: type,
                    roles: []
                  });
              });
              // Replace permissions with complete set of permissions
              $scope.permissions.splice.apply($scope.permissions, [0, $scope.permissions.length].concat(tempPerms));
            });

            $scope.getPermissionsToShow = function() {
              return $scope.permissions.filter($scope.shouldShowPermission);
            };

            $scope.shouldShowPermission = function(permission) {
              return !!SubmissionAccessLabels[permission.type];
            };

            $scope.getPermissionLabel = function(permission) {
              return SubmissionAccessLabels[permission.type].label;
            };

            $scope.getPermissionTooltip = function(permission) {
              return SubmissionAccessLabels[permission.type].tooltip;
            };
          }
        };
      }
    ])
    .controller('RoleController', [
      '$scope',
      'AppConfig',
      '$http',
      function (
        $scope,
        AppConfig,
        $http
      ) {

        // Load the roles.
        $http.get(AppConfig.appUrl + '/role').then(function (result) {
          $scope.roles = result.data;
        });
      }
    ])
    .controller('FormController', [
      '$scope',
      '$stateParams',
      '$state',
      'Formio',
      'AppConfig',
      'FormioAlerts',
      function (
        $scope,
        $stateParams,
        $state,
        Formio,
        AppConfig,
        FormioAlerts
      ) {
        $scope.formId = $stateParams.formId;
        $scope.formUrl = AppConfig.appUrl + '/form';
        $scope.appUrl = AppConfig.appUrl;
        $scope.formUrl += $stateParams.formId ? ('/' + $stateParams.formId) : '';
        $scope.form = {components:[], type: ($stateParams.formType ? $stateParams.formType : 'form')};
        $scope.formio = new Formio($scope.formUrl);

        // Load the form if the id is provided.
        if ($stateParams.formId) {
          $scope.formio.loadForm().then(function(form) {
            $scope.form = form;
          }, FormioAlerts.onError.bind(FormioAlerts));
        }

        // Match name of form to title if not customized.
        $scope.titleChange = function(oldTitle) {
          if (!$scope.form.name || $scope.form.name === _.camelCase(oldTitle)) {
            $scope.form.name = _.camelCase($scope.form.title);
          }
        };

        // When a submission is made.
        $scope.$on('formSubmission', function(event, submission) {
          FormioAlerts.addAlert({
            type: 'success',
            message: 'New submission added!'
          });
          if (submission._id) {
            $state.go('form.submission.item.view', {subId: submission._id});
          }
        });

        // Called when the form is updated.
        $scope.$on('formUpdate', function(event, form) {
          $scope.form.components = form.components;
        });

        $scope.$on('formError', function(event, error) {
          FormioAlerts.onError(error);
        });

        // Called when the form is deleted.
        $scope.$on('delete', function() {
          FormioAlerts.addAlert({
            type: 'success',
            message: 'Form was deleted.'
          });
          $state.go('home');
        });

        $scope.$on('cancel', function() {
          $state.go('form.view');
        });

        // Save a form.
        $scope.saveForm = function() {
          $scope.formio.saveForm(angular.copy($scope.form)).then(function(form) {
            var method = $stateParams.formId ? 'updated' : 'created';
            FormioAlerts.addAlert({
              type: 'success',
              message: 'Successfully ' + method + ' form!'
            });
            $state.go('form.view', {formId: form._id});
          }, FormioAlerts.onError.bind(FormioAlerts));
        };
      }
    ])
    .controller('FormActionController', [
      '$scope',
      '$stateParams',
      '$state',
      'Formio',
      'AppConfig',
      'FormioAlerts',
      'FormioUtils',
      '$q',
      function (
        $scope,
        $stateParams,
        $state,
        Formio,
        AppConfig,
        FormioAlerts,
        FormioUtils,
        $q
      ) {
        $scope.actionUrl = '';
        $scope.actionInfo = $stateParams.actionInfo || {settingsForm: {}};
        $scope.action = {data: {settings: {}, condition: {}}};
        $scope.newAction = {name: '', title: 'Select an Action'};
        $scope.availableActions = {};
        $scope.addAction = function() {
          if ($scope.newAction.name) {
            $state.go('form.action.add', {
              actionName: $scope.newAction.name
            });
          }
          else {
            FormioAlerts.onError({
              message: 'You must select an action to add.',
              element: 'action-select'
            });
          }
        };
        $scope.formio.loadActions().then(function(actions) {
          $scope.actions = actions;
        }, FormioAlerts.onError.bind(FormioAlerts));
        $scope.formio.availableActions().then(function(available) {
          if (!available[0].name) {
            available.shift();
          }
          available.unshift($scope.newAction);
          $scope.availableActions = available;
        });

        // Get the action information.
        var getActionInfo = function(name) {
          return $scope.formio.actionInfo(name).then(function(actionInfo) {
            if(actionInfo) {
              $scope.actionInfo = _.merge($scope.actionInfo, actionInfo);
              return $scope.actionInfo;
            }
          });
        };

        var onActionInfo = function(actionInfo) {
          // SQL Action missing sql server warning
          if(actionInfo && actionInfo.name === 'sql') {
            FormioUtils.eachComponent(actionInfo.settingsForm.components, function(component) {
              if(component.key === 'settings[type]' && JSON.parse(component.data.json).length === 0) {
                FormioAlerts.warn('<i class="glyphicon glyphicon-exclamation-sign"></i> You do not have any SQL servers configured. You can add a SQL server in the config/default.json configuration.');
              }
            });
          }

          // Email action missing transports (other than the default one).
          if(actionInfo && actionInfo.name === 'email') {
            FormioUtils.eachComponent(actionInfo.settingsForm.components, function(component) {
              if(component.key === 'settings[transport]' && JSON.parse(component.data.json).length <= 1) {
                FormioAlerts.warn('<i class="glyphicon glyphicon-exclamation-sign"></i> You do not have any email transports configured. You need to add them in the config/default.json configuration.');
              }
            });
          }

          // Auth action alert for new resource missing role assignment.
          if(actionInfo && actionInfo.name === 'auth') {
            $scope.$watch('action.data.settings', function(current, old) {
              if(current.hasOwnProperty('association')) {
                angular.element('#form-group-role').css('display', current.association === 'new' ? '' : 'none');
              }

              // Make the role required for submission if this is a new association.
              if (
                current.hasOwnProperty('association') &&
                old.hasOwnProperty('association') &&
                current.association !== old.association
              ) {
                // Find the role settings component, and require it as needed.
                FormioUtils.eachComponent(actionInfo.settingsForm.components, function(component) {
                  if (component.key && component.key === 'role') {
                    // Update the validation settings.
                    component.validate = component.validate || {};
                    component.validate.required = (current.association === 'new' ? true : false);
                  }
                });

                // Dont save the old role settings if this is an existing association.
                current.role = (current.role && (current.association === 'new')) || '';
              }
            }, true);
          }

          // Role action alert for new resource missing role assignment.
          if(actionInfo && actionInfo.name === 'role') {
            FormioAlerts.warn('<i class="glyphicon glyphicon-exclamation-sign"></i> The Role Assignment Action requires a Resource Form component with the API key, \'submission\', to modify existing Resource submissions.');
          }
        };

        /**
         * Load an action into the scope.
         * @param defaults
         */
        var loadAction = function(defaults) {
          if ($stateParams.actionId) {
            $scope.actionUrl = $scope.formio.formUrl + '/action/' + $stateParams.actionId;
            var loader = new Formio($scope.actionUrl);
            return loader.loadAction().then(function(action) {
              $scope.action = _.merge($scope.action, {data: action});
              return getActionInfo(action.name);
            });
          }
          else {
            $scope.action = _.merge($scope.action, {data: defaults});
            $scope.action.data.settings = {};
            return $q.when($scope.actionInfo);
          }
        };

        // Get the action information.
        if (!$stateParams.actionInfo && $stateParams.actionName) {
          getActionInfo($stateParams.actionName).then(function(info) {
            loadAction(info.defaults).then(onActionInfo);
          });
        }
        else {
          // Load the action.
          loadAction($scope.actionInfo.defaults).then(onActionInfo);
        }

        // Called when the action has been updated.
        $scope.$on('formSubmission', function(event) {
          event.stopPropagation();
          FormioAlerts.addAlert({type: 'success', message: 'Action was updated.'});
          $state.go('form.action.index');
        });

        $scope.$on('delete', function(event) {
          event.stopPropagation();
          FormioAlerts.addAlert({type: 'success', message: 'Action was deleted.'});
          $state.go('form.action.index');
        });

        $scope.$on('cancel', function(event) {
          event.stopPropagation();
          $state.go('form.action.index');
        });
      }
    ])
    .controller('FormSubmissionController', [
      '$scope',
      '$stateParams',
      '$state',
      'Formio',
      'AppConfig',
      'FormioAlerts',
      function (
        $scope,
        $stateParams,
        $state,
        Formio,
        AppConfig,
        FormioAlerts
      ) {
        $scope.token = Formio.getToken();
        $scope.submissionId = $stateParams.subId;
        $scope.submissionUrl = $scope.formUrl;
        $scope.submissionUrl += $stateParams.subId ? ('/submission/' + $stateParams.subId) : '';
        $scope.submissionData = Formio.submissionData;
        $scope.submission = {};

        // Load the form and submissions.
        $scope.formio = new Formio($scope.submissionUrl);

        // Load the submission.
        $scope.formio.loadSubmission().then(function(submission) {
          $scope.submission = submission;
        });

        $scope.$on('formSubmission', function(event, submission) {
          event.stopPropagation();
          var message = (submission.method === 'put') ? 'updated' : 'created';
          FormioAlerts.addAlert({
            type: 'success',
            message: 'Submission was ' + message + '.'
          });
          $state.go('form.submission.index', {formId: $scope.formId});
        });

        $scope.$on('delete', function(event) {
          event.stopPropagation();
          FormioAlerts.addAlert({
            type: 'success',
            message: 'Submission was deleted.'
          });
          $state.go('form.submission.index');
        });

        $scope.$on('cancel', function(event) {
          event.stopPropagation();
          $state.go('form.submission.item.view');
        });

        $scope.$on('formError', function(event, error) {
          event.stopPropagation();
          FormioAlerts.onError(error);
        });

        $scope.$on('submissionView', function(event, submission) {
          $state.go('form.submission.item.view', {
            subId: submission._id
          });
        });

        $scope.$on('submissionEdit', function(event, submission) {
          $state.go('form.submission.item.edit', {
            subId: submission._id
          });
        });

        $scope.$on('submissionDelete', function(event, submission) {
          $state.go('form.submission.item.delete', {
            subId: submission._id
          });
        });
      }
    ])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider, $urlRouterProvider, AppConfig) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'views/main.html',
        controller: ['$scope', function($scope) {
          $scope.resources = [];
          $scope.resourcesUrl = AppConfig.appUrl + '/form?type=resource';
          $scope.forms = [];
          $scope.formsUrl = AppConfig.appUrl + '/form?type=form';
          $scope.formsPerPage = 5;
        }]
      })
      .state('login', {
        url: '/login',
        templateUrl: 'views/user/login.html',
        controller: ['$scope', '$state', '$rootScope', function($scope, $state, $rootScope) {
          $scope.$on('formSubmission', function(err, submission) {
            if (!submission) { return; }
            $rootScope.user = submission;
            $state.go('home');
          });
        }]
      })
      .state('createForm', {
        url: '/create/:formType',
        templateUrl: 'views/form/create.html',
        controller: 'FormController'
      })
      .state('form', {
        abstract: true,
        url: '/form/:formId',
        templateUrl: 'views/form/form.html',
        controller: 'FormController'
      })
      .state('form.view', {
        url: '/',
        parent: 'form',
        templateUrl: 'views/form/view.html'
      })
      .state('form.edit', {
        url: '/edit',
        parent: 'form',
        templateUrl: 'views/form/edit.html'
      })
      .state('form.delete', {
        url: '/delete',
        parent: 'form',
        templateUrl: 'views/form/delete.html'
      });

    var formStates = {};
    formStates['form.submission'] = {
      path: '/submission',
      id: 'subId',
      controller: 'FormSubmissionController'
    };
    formStates['form.action'] = {
      path: '/action',
      id: 'actionId',
      controller: 'FormActionController'
    };

    angular.forEach(formStates, function(info, state) {
      $stateProvider
        .state(state, {
          abstract: true,
          url: info.path,
          parent: 'form',
          template: '<div ui-view></div>'
        })
        .state(state + '.index', {
          url: '',
          parent: state,
          templateUrl: 'views/form' + info.path + '/index.html',
          controller: info.controller
        })
        .state(state + '.item', {
          abstract: true,
          url: '/:' + info.id,
          parent: state,
          controller: info.controller,
          templateUrl: 'views/form' + info.path + '/item.html'
        })
        .state(state + '.item.view', {
          url: '',
          parent: state + '.item',
          templateUrl: 'views/form' + info.path + '/view.html'
        })
        .state(state + '.item.edit', {
          url: '/edit',
          parent: state + '.item',
          templateUrl: 'views/form' + info.path + '/edit.html'
        })
        .state(state + '.item.delete', {
          url: '/delete',
          parent: state + '.item',
          templateUrl: 'views/form' + info.path + '/delete.html'
        });
    });

    // Add the action adding state.
    $stateProvider.state('form.action.add', {
      url: '/add/:actionName',
      parent: 'form.action',
      templateUrl: 'views/form/action/add.html',
      controller: 'FormActionController',
      params: {actionInfo: null}
    });

    // Add permission state.
    $stateProvider.state('form.permission', {
      url: '/permission',
      parent: 'form',
      templateUrl: 'views/form/permission/index.html',
      controller: 'RoleController'
    });

    // Register the form routes.
    $urlRouterProvider.otherwise('/');
  }

})();
