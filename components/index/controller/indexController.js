angularModules.config(function ($stateProvider, $urlRouterProvider, routes) {

  $urlRouterProvider.otherwise('/' + routes[0].url);

  angular.forEach(routes, function(route){
    $stateProvider
      .state(route.name, {
        url: '/' + route.url,
        views: {
          "searchPanel": {templateUrl: "partials/index/" + route.url, controller: IndexCtrl}
        }
      })
  });
});

function IndexCtrl($scope, $rootScope, config, JIRA, Statistics) {

  $scope.config = config;

  $scope.currentSprintJiras = JIRA.currentSprint.get();

  $scope.allJiras = JIRA.throughputData.get(function (jiras) {
    $scope.stats = Statistics.generateStatsFromIssues(jiras.issues);
    $scope.stat = $scope.stats[$scope.stats.length - 1];
    $scope.graphData = Statistics.generateGraphDataFromStat($scope.stats);

    $scope.loaded = true;
  });

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