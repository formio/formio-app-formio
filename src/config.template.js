angular.module('formioApp').constant('AppConfig', {
  appUrl: '{{ protocol }}://{{ path }}.{{ host }}',
  apiUrl: '{{ protocol }}://api.{{ host }}'
});
