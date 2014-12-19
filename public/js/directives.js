'use strict';

/* Directives */

var metricsDirectives = angular.module('myApp.directives', []);

metricsDirectives.directive('appVersion', function(version) {
  return function(scope, elm, attrs) {
    elm.text(version);
  };
});