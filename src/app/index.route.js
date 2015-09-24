(function() {
  'use strict';

  angular
    .module('formioAppTodo')
    .provider('Resource', [
      '$stateProvider',
      function(
        $stateProvider
      ) {
        var resources = {};
        return {
          register: function(name, defaultValue) {
            resources[name] = name;
            var formName = name + 'Form';
            $stateProvider
              .state(name + 'Index', {
                url: '/' + name,
                templateUrl: 'views/resource/index.html',
                controller: ['$scope', '$state', function ($scope, $state) {
                  $scope.resourceName = name;
                  $scope.resourceForm = $scope[formName];
                  $scope.$on('submissionView', function(event, submission) {
                    $state.go(name + '.view', {id: submission._id});
                  });

                  $scope.$on('submissionEdit', function(event, submission) {
                    $state.go(name + '.edit', {id: submission._id});
                  });

                  $scope.$on('submissionDelete', function(event, submission) {
                    $state.go(name + '.delete', {id: submission._id});
                  });
                }]
              })
              .state(name + 'Create', {
                url: '/create/' + name,
                templateUrl: 'views/resource/create.html',
                controller: ['$scope', '$state', function ($scope, $state) {
                  $scope.resource = defaultValue ? defaultValue() : {};
                  $scope.resourceForm = $scope[formName];
                  $scope.$on('formSubmission', function(event, submission) {
                    $state.go(name + '.view', {id: submission._id});
                  });
                }]
              })
              .state(name, {
                abstract: true,
                url: '/' + name + '/:id',
                templateUrl: 'views/resource/resource.html',
                controller: ['$scope', '$stateParams', function ($scope, $stateParams) {
                  $scope.resourceName = name;
                  $scope.resourceForm = $scope[formName];
                  $scope.resourceUrl = $scope.resourceForm + '/submission/' + $stateParams.id;
                }]
              })
              .state(name + '.view', {
                url: '/',
                parent: name,
                templateUrl: 'views/' + name + '/view.html',
                controller: ['$scope', '$stateParams', 'Formio', function ($scope, $stateParams, Formio) {
                  $scope.resource = defaultValue ? defaultValue() : {};
                  $scope.position = {lat: '40.74', lng: '-74.18'};
                  (new Formio($scope.resourceUrl)).loadSubmission().then(function(submission) {
                    if (submission.data.address) {
                      $scope.position.lat = submission.data.address.geometry.location.lat;
                      $scope.position.lng = submission.data.address.geometry.location.lng;
                    }
                    $scope.resource = submission;
                  });
                }]
              })
              .state(name + '.edit', {
                url: '/edit',
                parent: name,
                templateUrl: 'views/resource/edit.html',
                controller: ['$scope', '$state', function ($scope, $state) {
                  $scope.$on('formSubmission', function(event, submission) {
                    $state.go(name + '.view', {id: submission._id});
                  });
                }]
              })
              .state(name + '.delete', {
                url: '/delete',
                parent: name,
                templateUrl: 'views/resource/delete.html',
                controller: ['$scope', '$state', function ($scope, $state) {
                  $scope.$on('delete', function() {
                    $state.go('home');
                  });
                }]
              });
          },
          $get: function() {
            return resources;
          }
        };
      }
    ])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider, $urlRouterProvider, ResourceProvider, FormioProvider, AppConfig) {

    // Set the base url for formio.
    FormioProvider.setBaseUrl(AppConfig.apiUrl);

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'views/main.html',
        controller: ['$scope', '$state', '$rootScope', function($scope, $state, $rootScope) {
          $scope.todos = [];
          $scope.todosUrl = $rootScope.todoForm + '/submission';
          $scope.getStatus = function(todo) {
            switch (todo.data.status) {
              case 'notstarted':
                return 'danger';
              case 'started':
                return 'info';
              case 'done':
                return 'success';
            }
            return '';
          };
        }]
      })
      .state('auth', {
        abstract: true,
        url: '/auth',
        templateUrl: 'views/user/auth.html'
      })
      .state('auth.login', {
        url: '/login',
        parent: 'auth',
        templateUrl: 'views/user/login.html',
        controller: ['$scope', '$state', '$rootScope', function($scope, $state, $rootScope) {
          $scope.$on('formSubmission', function(err, submission) {
            if (!submission) { return; }
            $rootScope.user = submission;
            $state.go('home');
          });
        }]
      })
      .state('auth.register', {
        url: '/register',
        parent: 'auth',
        templateUrl: 'views/user/register.html',
        controller: ['$scope', '$state', '$rootScope', function($scope, $state, $rootScope) {
          $scope.$on('formSubmission', function(err, submission) {
            if (!submission) { return; }
            $rootScope.user = submission;
            $state.go('home');
          });
        }]
      });

    // Register the todo routes.
    ResourceProvider.register('todo', function() {
      return {data: {status: 'notstarted'}};
    });
    $urlRouterProvider.otherwise('/');
  }

})();
