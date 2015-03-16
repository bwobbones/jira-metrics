angularModules.config(function ($stateProvider, $urlRouterProvider, routes) {

  $urlRouterProvider.otherwise('/' + routes[0].url);

  angular.forEach(routes, function(route){
    $stateProvider
      .state(route.name, {
        url: '/' + route.url + '?play',
        views: {
          "searchPanel": {templateUrl: "partials/index/" + route.url, controller: IndexCtrl}
        }
      })
  });
});

function IndexCtrl($scope, $rootScope, config, JIRA, Statistics, $interval) {
  $scope.config = config;

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
  }

  runAndSchedule(function () {
    $scope.currentSprintJiras = JIRA.currentSprint.get();
  });

  runAndSchedule(function () {
    JIRA.throughputData.get(function (jiras) {
      $scope.weeklyBuckets = Statistics.generateBucketsFromIssues(jiras.issues);
      $scope.stats = Statistics.generateStatsFromBuckets($scope.weeklyBuckets);
      $scope.stat = $scope.stats[$scope.stats.length - 1];
      $scope.graphData = Statistics.generateGraphDataFromStat($scope.stats);
    });
  });

  $scope.performanceLoaded = function() {
    $scope.performanceFinishedLoading = true;
  };

  $scope.replicationLoaded = function() {
    $scope.replicationFinishedLoading = true;
  };

  $scope.isInt = function (n) {
    return n % 1 === 0;
  }

  $rootScope.$on('toggleBarChart', function(event, isBarchart){
    $scope.isBarchart = isBarchart;
    if(isBarchart) {
      $scope.options.chart.type = 'lineChart';
    } else {
      $scope.options.chart.type = 'multiBarChart';
    }
  });

  $scope.options = {
      chart: {
          type: $scope.isBarchart ? 'lineChart' : 'multiBarChart',
          height: 300,
          margin : {
              top: 20,
              right: 20,
              bottom: 40,
              left: 55
          },
          transitionDuration: 500,
          x: function(d) { return d.weekNumber; },
          y: function(d) { return d.value; },
          useInteractiveGuideline: true,
          xAxis: {
              axisLabel: 'Week',
              tickFormat: function(d) {
                return $scope.stats[d - 1].week;
              },
          },
          tooltipContent: function (key, x, y, e, graph) {
            return '<h3>' + key + '</h3>' +
                   '<p>' +  ($scope.isInt(y) ? d3.round(y) : y) + ' ' + e.point.type + ' for Week ' + e.point.week + '</p>'
          }
      }
  };
}