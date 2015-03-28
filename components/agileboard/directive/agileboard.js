/**
 * Widget Directive
 */

angular
    .module('myApp')
    .directive('agileboard', agileboard);

function agileboard() {
    var directive = {
        scope: {
            component: '=',
            jiras: '='
        },
        transclude: true,
        templateUrl: '/partials/agileboard/agileboard',
        restrict: 'EA',
        controller: function($scope, JIRA, config, $interval, $filter) {
          $scope.config = config;
          $scope.loading = true;

          function runAndSchedule(task) {
            task();
            var retrieverInterval = $interval(task, config.updateTimeInMins * 60 * 1000);

            $scope.$on('$destroy', function() {
              // Make sure that the interval is destroyed too
              if (angular.isDefined(retrieverInterval)) {
                $interval.cancel(retrieverInterval);
                retrieverInterval = undefined;
              }
            });
          };

          function getJiras(component) {
            console.log("Refreshing Agile board: " + component);

            $scope.jiras = JIRA.currentSprint(component).get(function(jiras) {
              $scope.loading = false;
            });
          }

          runAndSchedule(function () {
            getJiras($scope.component);
          });
        }
    };

    return directive;
};