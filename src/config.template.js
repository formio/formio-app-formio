angular.module('formioAppTodo').constant('AppConfig', {
  appUrl: '{{ protocol }}://{{ path }}.{{ host }}',
  apiUrl: '{{ protocol }}://api.{{ host }}'
});
