/**
 * Widget Directive
 */

angular
    .module('myApp')
    .directive('feed', feed);

function feed($http,config, $sce, $interval) {
    var directive = {
        scope: {
            src: '='
        },
        transclude: true,
        template: '<rd-loading ng-show="loading"></rd-loading><table class="table"><tbody><tr ng-repeat="item in items"><td><div class="row"><div ng-bind-html="getImage(item)" class="col-xs-1"></div><div ng-bind-html="getHtml(item)" class="col-xs-11"></div><div class="col-xs-11 pull-right"><i style="margin-right:10px;" class="fa fa-clock-o"></i>{{item.updated | date:"medium"}}</div></div></td></tr></tbody></table>',
        restrict: 'EA',
        controller:function($scope, $http, config, $sce){
          $scope.items = [];
          $scope.loading = true;

          $scope.getImage = function(item) {
            var html = '';
            if(item.author.link) {
              html += '<img class="img-thumbnail" src="' + config.jiraHostName + '/secure/useravatar?ownerId=' + item.author.username.__text + '" title="' + item.author.name + '"/>';
            }
            return $sce.trustAsHtml(html);
          }

          $scope.getHtml = function(item) {
            var html = '';
            if(item.title) {
              html += item.title.__text;
            }
            if(item.summary) {
              html += '<br/>' + item.summary.__text;
            }
            return $sce.trustAsHtml(html);
          }

          function getFeed(url) {
            console.log("Refreshing feed: " + url)
            $http.get('api/xml?url=' + url).success(function(data) {
              $scope.loading = false;
              $scope.items = [];

              var activity = x2js.xml_str2json(data);

              _.each(activity.feed.entry, function(activity) {
                $scope.items.push(activity);
              });
            }).error(function(e){ console.log(e);});
          }

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

          runAndSchedule(function () {
            getFeed($scope.src);
          });
        }
    };

    return directive;
};