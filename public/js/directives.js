'use strict';

/* Directives */

var metricsDirectives = angular.module('myApp.directives', []);

metricsDirectives.directive('appVersion', function(version) {
  return function(scope, elm, attrs) {
    elm.text(version);
  };
})

.directive('ngLoad', ['$parse', function($parse){

    return {
        restrict: 'A',
        compile: function($element, attr) {
            var fn = $parse(attr['ngLoad']);

            return function(scope, element, attr) {
                element.on('load', function(event) {
                    scope.$apply(function() {
                        fn(scope, {$event:event});
                    });
                });
            };

        }
    };
}]);