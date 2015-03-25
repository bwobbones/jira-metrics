'use strict';

// Declare app level module which depends on filters, and services

var angularModules = angular.module('myApp', [
  'ui.bootstrap',
  'ui.router',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'ngResource',
  'ngCookies',
  'nvd3',
  'RDash',
  'ngSanitize',
  'timer',
  'angular.filter',
  'angularMoment',
  'FBAngular',
]);

var jiraHostName = 'https://resourceful.atlassian.net';
var confluenceHostName = 'https://resourceful.atlassian.net';
var mercurialHostName = 'https://resourceful.atlassian.net';
var jenkinsHostName = 'https://builds.apache.org';

angularModules.value('config', {
  title: 'Metrics Dashboard',
  jiraHostName: jiraHostName,
  confluenceHostName: confluenceHostName,
  mercurialHostName: mercurialHostName,
  jenkinsHostName: jenkinsHostName,
  projects: ["'Resource'"],
  issueTypes: ['Bug', '"New Feature"', 'Improvement', 'Technical', 'Task'],
  completionTypes: ['Fixed'],
  slideTimeInSecs: 45,
  updateTimeInMins: 10,
  agileColumns: [
    {
      name: 'TODO',
      statuses: ['Open', 'Reopened', 'Awaiting Assignment', 'Inactive']
    },
    {
      name: 'In Progress',
      statuses: ['In Progress']
    },
    {
      name: 'Done',
      statuses: ['Closed', 'Resolved']
    }
  ],
});

angularModules.constant('routes', [
  {
    name: 'Metrics',
    url: 'metrics',
    icon: 'fa-bar-chart'
  },
  {
    name: 'Agile',
    url: 'agile',
    icon: 'fa-tachometer'
  },
  {
    name: 'Activity',
    url: 'activity',
    icon: 'fa-quote-right'
  },
  {
    name: 'JIRA',
    url: 'jira',
    icon: 'fa-child'
  },
  {
    name: 'Jenkins',
    url: 'jenkins',
    icon: 'fa-cube'
  },
]);

angularModules.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
});

angularModules.run(function(amMoment) {
    amMoment.changeLocale('en');
});