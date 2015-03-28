/**
 * Widget Directive
 */

angular
    .module('myApp')
    .directive('issue', issue);

function issue() {
    var directive = {
        scope: {
            jira: '='
        },
        transclude: true,
        templateUrl: '/partials/issue/issue',
        restrict: 'EA',
        controller: function($scope, $filter, config) {
          $scope.config = config;
          $scope.issue = $scope.jira;

          $scope.listSubtasks = function(subtasks) {
            var result = "";

            _.each(subtasks, function(subtask){
              result += subtask.key + " - " + subtask.fields.summary + "\n";
            });

            return result;
          };

          $scope.formatSubtaskTitle = function(type, tasks) {
            var count = $filter('taskStatusNot')(tasks, 'Review/Test Passed', 'Review/Test Closed').length;
            return count + " " + type.replace(' Sub-Task', '').replace(' Review', '') + (count === 1 ? '' : 's') + ' Pending';
          }

          $scope.typeLabelClass = function(type) {
            var labelClass;

            if(type === 'Design Review Sub-Task') {
              labelClass = 'label-info';
            } else if (type === 'Code Review Sub-Task') {
              labelClass = 'label-warning';
            } else if (type === 'Test Sub-Task') {
              labelClass = 'label-success';
            } else {
              labelClass = 'label-default';
            }

            return labelClass;
          }
        }
    };

    return directive;
};