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

function IndexCtrl($scope, $rootScope, $filter, config, JIRA, Statistics, Jenkins, $interval, _, $http) {
  $scope.config = config;
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


  runAndSchedule(function () {
    $scope.weeklyCreatedJiras = JIRA.weeklyCreated.get();
  });

  runAndSchedule(function () {
    $scope.currentSprintJiras = JIRA.currentSprint.get();
  });

  runAndSchedule(function () {
    JIRA.throughputData.get(function (jiras) {
      $scope.people = Statistics.getPeopleFromIssues(jiras.issues);
      $scope.weeklyBuckets = Statistics.generateBucketsFromIssues(jiras.issues);
      $scope.stats = Statistics.generateStatsFromBuckets($scope.weeklyBuckets);
      $scope.graphData = Statistics.generateGraphDataFromStat($scope.stats);
    });
  });

  $scope.listSubtasks = function(issue) {
    var result = "";

    _.each(issue.fields.subtasks, function(subtask){
      result += subtask.fields.summary + "\n";
    });

    return result;
  };

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
}