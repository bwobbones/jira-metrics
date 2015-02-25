'use strict';

// Declare app level module which depends on filters, and services

var angularModules = angular.module('myApp', [
  'ui.bootstrap',
  'ui.router',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'ngResource',
  'nvd3'
]);

angularModules.value('config', {
	jiraHostName: 'https://resourceful.atlassian.net',
	projects: ["'Resource'"],
	issueTypes: ['Bug', '"New Feature"', 'Improvement', 'Technical', 'Task'],
  completionTypes: ['Fixed', 'Completed', 'Complete']
});

angularModules.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
});