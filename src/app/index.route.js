(function() {
  'use strict';
  angular
    .module('formioApp')
    .config(routeConfig);

  /** @ngInject */
  function routeConfig(
    $stateProvider,
    $urlRouterProvider,
    AppConfig,
    FormioFormBuilderProvider
  ) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'views/main.html',
        controller: ['$scope', function($scope) {
          $scope.resources = [];
          $scope.resourcesUrl = AppConfig.appUrl + '/form?type=resource';
          $scope.resourcesLoading = true;
          $scope.forms = [];
          $scope.formsUrl = AppConfig.appUrl + '/form?type=form';
          $scope.formsLoading = true;
          $scope.formsPerPage = 5;
          $scope.$on('pagination:loadPage', function (event, status, config) {
            if (config.url.indexOf('type=resource') !== -1) {
              $scope.resourcesLoading = false;
            }
            if (config.url.indexOf('type=form') !== -1) {
              $scope.formsLoading = false;
            }
          });
        }]
      });

    // Register the form builder provider.
    FormioFormBuilderProvider.register('', AppConfig.appUrl, {});

    // Register the form routes.
    $urlRouterProvider.otherwise('/');
  }

})();
