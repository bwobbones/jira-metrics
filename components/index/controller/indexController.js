angularModules.config(function ($stateProvider, $urlRouterProvider, routes) {

  $urlRouterProvider.otherwise('/' + routes[0].url);

  angular.forEach(routes, function(route){
    $stateProvider
      .state(route.name, {
        url: '/' + route.url + '?play',
        views: {
          "searchPanel": {templateUrl: "partials/index/" + route.url}
        }
      })
  });
});
angular.module('myApp')
    .controller('IndexCtrl', ['$scope', '$rootScope', '$filter', 'config', 'JIRA', 'Statistics', 'Jenkins', '$interval', '_', '$http', '$q', 'Fullscreen', IndexCtrl]);

function IndexCtrl($scope, $rootScope, $filter, config, JIRA, Statistics, Jenkins, $interval, _, $http, $q,Fullscreen) {
  $scope.config = config;

  $scope.toggleFullScreen = function(chartOptions) {
      chartOptions.fullscreen = !chartOptions.fullscreen;
      chartOptions.chart.height = chartOptions.fullscreen ? null : 450;
  }


  Fullscreen.$on('FBFullscreen.change', function(evt, isFullscreenEnabled) {
    function handleFullscreen(chartOptions, isFullscreenEnabled){
      if(isFullscreenEnabled) {
        chartOptions.chart.height = null;
        chartOptions.fullscreen = true;
      } else {
        chartOptions.chart.height = 450;
        chartOptions.fullscreen = false;
      }
    }

    handleFullscreen($scope.chartOptions);
    handleFullscreen($scope.createdVsResolvedChartOptions);
  });

  $scope.filter = function(filterName, array, expression) {
    return $filter(filterName)(array, expression);
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

  $scope.buildResultStatusClass = function(build) {
    var status = build.data.result;
    var statusClass;
    if(!build.data.building) {
      if(status === 'SUCCESS') {
        statusClass = 'label-success';
      } else if (status === 'FAILURE') {
        statusClass = 'label-danger';
      } else if (status === 'UNSTABLE') {
        statusClass = 'label-warning';
      } else {
        statusClass = 'label-info';
      }
    } else {
      statusClass = 'label-primary';
    }

    return statusClass;
  }

  $scope.addBuild = function (displayName, buildName) {
    buildName = buildName || displayName;

    $scope.totalBuilds += 1;
    var build = {
      displayName: displayName
    };

    runAndSchedule(function () {
      build.data = Jenkins.build(buildName).get();
    });

    $scope.builds.push(build);
  };

  $scope.builds = [];
  $scope.addBuild('incubator-taverna-engine');
  $scope.addBuild('AuroraBot');
  $scope.addBuild('Hadoop-Mapreduce-trunk-Java8');
  $scope.addBuild('Lucene-Artifacts-5.0');

  function buildCreatedVsResolved() {
    $scope.createdJiras = JIRA.created.get();
    $scope.resolvedJiras = JIRA.resolved.get();

    $q.all([
      $scope.createdJiras.$promise,
      $scope.resolvedJiras.$promise
    ]).then(function() {
        // Build created vs resolved chart here
        var created = $scope.createdJiras.issues;
        var resolved = $scope.resolvedJiras.issues;
        console.log('Created: ' + created.length);
        console.log('Resolved: ' + resolved.length);

        var createdBuckets = Statistics.generateCreatedBucketsFromIssues(created);
        var resolvedBuckets = Statistics.generateResolvedBucketsFromIssues(resolved);
        $scope.createdVsResolvedData = Statistics.generateCreatedVsResolvedData(createdBuckets, resolvedBuckets);
    });
  }

  runAndSchedule(function () {
    $scope.dailyCreatedJiras = JIRA.dailyCreated.get();
  });

  runAndSchedule(function () {
    JIRA.throughputData.get(function (jiras) {
      $scope.people = Statistics.getPeopleFromIssues(jiras.issues);
      $scope.weeklyBuckets = Statistics.generateResolvedBucketsFromIssues(jiras.issues);
      $scope.stats = Statistics.generateStatsFromBuckets($scope.weeklyBuckets);
      $scope.graphData = Statistics.generateGraphDataFromStat($scope.stats);
    });
  });

  buildCreatedVsResolved();

  runAndSchedule(function () {
    $scope.unfinishedJiras = JIRA.unfinishedJIRAs.get();
  });


  $scope.performanceLoaded = function() {
    $scope.performanceFinishedLoading = true;
  };

  $scope.replicationLoaded = function() {
    $scope.replicationFinishedLoading = true;
  };

  $scope.isInt = function (n) {
    return n % 1 === 0;
  };

  $rootScope.$on('toggleBarChart', function(event, isBarchart) {
    $scope.isBarchart = isBarchart;
    if(isBarchart) {
      $scope.options.chart.type = 'lineChart';
    } else {
      $scope.options.chart.type = 'multiBarChart';
    }
  });

  $scope.createdVsResolvedChartOptions = {
      chart: {
          type: 'lineChart',
          height: 450,
          transitionDuration: 500,
          x: function(d) { return moment(d.week, "DD/MM/YYYY"); },
          y: function(d) { return d.value; },
          mean: function(d) { return d.value; },
          useInteractiveGuideline: true,
          xAxis: {
              axisLabel: 'Week',
              tickFormat: function(d) {
                return moment(d).format("DD/MM/YYYY");
              },
               // staggerLabels: true,
              showMaxMin: false,
          },
          yAxis: {
            showMaxMin: false,
          }
      }
  };

  $scope.chartOptions = {
      chart: {
          type: $scope.isBarchart ? 'lineChart' : 'multiBarChart',
          height: 450,
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

  // Disable nvd3 resize events
  // See https://github.com/krispo/angular-nvd3/issues/18
  window.nv.charts = {};
  window.nv.graphs = [];
  window.nv.logs = {};
  // remove resize listeners
  window.onresize = null;
}