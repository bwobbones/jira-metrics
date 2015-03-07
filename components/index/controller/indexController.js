angularModules.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {

  $urlRouterProvider.otherwise('/metrics');

  $stateProvider
    .state('Metrics', {
      url: '/metrics',
      views: {
        "searchPanel": {templateUrl: "partials/index/metrics", controller: IndexCtrl}
      }
    })
    .state('agile', {
        url: '/agile',
        views: {
          "searchPanel": {templateUrl: "partials/index/agile", controller: IndexCtrl}
        }
    })
    .state('activity', {
        url: '/activity',
        views: {
          "searchPanel": {templateUrl: "partials/index/activity", controller: IndexCtrl}
        }
    })
});

function IndexCtrl($scope, $rootScope, $state, $resource, $q, config, _, $http, $sce) {

  $scope.config = config;
  $scope.weekBuckets = createWeekBuckets();

  $scope.generateDataFromStat = function(stats) {
    var throughputData = [];
    var peopleData = [];

    var predictabilityData = [];
    var productivityData = [];

    var velocities = [];
    var magnitudes = [];

    for (var i = 0; i < stats.length; i++) {
      var stat = stats[i];
      var throughput = d3.round(stat.throughput[stat.throughput.length - 1]);
      var date =  stat.week;
      throughputData.push({
        week: date,
        weekNumber: i + 1,
        type: $scope.format(throughput, 'issue', 'issues'),
        value: throughput
      });

      var people = d3.round(stat.people.length);
      peopleData.push({
        week:  date,
        weekNumber: i + 1,
        type: 'people',
        value: people
      });

      var totalMagnitude = stat.magnitudes[stat.magnitudes.length - 1];
      magnitudes.push({
        week:  date,
        weekNumber: i + 1,
        type: 'points',
        value: totalMagnitude
      });

      var velocity = totalMagnitude / stat.people.length / 5;
      velocities.push({
        week:  date,
        weekNumber: i + 1,
        type: 'points/person/day',
        value: velocity
      });

      predictabilityData.push({
        week: date,
        weekNumber: i + 1,
        type: '',
        value: stat.predictability
      });

      productivityData.push({
        week: date,
        weekNumber: i + 1,
        type: '',
        value: stat.productivity
      });
    };

    return {
      throughputPeople: [
            {
                values: throughputData,
                key: 'Throughput',
                //color: '#ff7f0e',
                area: true
            },
            {
                values: peopleData,
                key: 'People',
                //color: '#ff7f0e',
                //area: true
            },
            {
                values: magnitudes,
                key: 'Magnitude Completed',
                //color: '#ff7f0e',
                //area: true
            },
          ],

          predictabilityProductivity: [
            {
                values: productivityData,
                key: 'Productivity',
                //color: '#ff7f0e',
                area: true
            },
            {
                values: predictabilityData,
                key: 'Predictability',
                //color: '#ff7f0e',
                area: true
            },
            {
                values: velocities,
                key: 'Velocity',
                //color: '#ff7f0e',
                area: true
            },
          ]
        };
  };

  $scope.format = function (count, one, many) {
    return (count == 1 ? one : many);
  }

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

  $scope.chartType = function() {
    if($scope.isBarchart) {
      return 'lineChart';
    } else {
      return 'multiBarChart';
    }
  };

  $scope.options = {
      chart: {
          type: $scope.chartType(),
          height: 300,
          margin : {
              top: 20,
              right: 20,
              bottom: 40,
              left: 55
          },
          transitionDuration: 500,
          x: function(d) { return d.weekNumber; },
          // x: function(d) { return new Date(d.week).getTime(); },
          y: function(d) { return d.value; },
          useInteractiveGuideline: true,
          xAxis: {
              axisLabel: 'Week',
              tickFormat: function(d) {
                //return d3.time.format('%d-%m-%y')(new Date($scope.stats[d - 1].week));
                return $scope.stats[d - 1].week;
              },
              //rotateLabels: 90
          },
          yAxis: {
              //axisLabel: 'Throughput',
              //axisLabelDistance: 30
          },
          tooltipContent: function (key, x, y, e, graph) {
            return '<h3>' + key + '</h3>' +
                   '<p>' +  ($scope.isInt(y) ? d3.round(y) : y) + ' ' + e.point.type + ' for Week ' + e.point.week + '</p>'
          }
      },
      title: {
          enable: false,
          text: function() { return 'Stats for Week ending ' + ($scope.stat ? $scope.stat.week : ''); }
      },
      caption: {
          enable: false,
          html: '<b>Productivity</b> = Number of <strong>issues/week</strong> normalised by the number of people <b>(High = good)</b><br><b>Predictability</b> = Coefficient of Variance - StdDev of throughput / Mean of throughput <b>(Low = good)</b>',//<sup>[1, <a href="https://github.com/krispo/angular-nvd3" target="_blank">2</a>, 3]</sup>.',
          css: {
              'text-align': 'justify',
              //'margin': '10px 13px 0px 7px'
          }
      }
  };

  $scope.currentSprintJiras = $resource('api/search', {
      jiraHostName: config.jiraHostName,
      'projects[]': config.projects,
      issueTypes: config.issueTypes,
      search: "labels in (teammatrix)",
  }, { get : { method : 'GET', cache: true}}).get();

  $scope.allJiras = $resource('api/throughputData', {
        jiraHostName: config.jiraHostName,
        'projects[]': config.projects,
        'completionTypes[]': config.completionTypes,
        issueTypes: config.issueTypes
    }, { get : { method : 'GET', cache: true}}).get(function() {
    putIssuesInBuckets();
    var periodWindows = getPeriodWindows();
    $scope.stats = [];
    var data = [];
    var i = 0;
    _.each(periodWindows, function(periodWindow) {
      var people = getPeople(periodWindow);
      var weeklyThroughput = getWeeklyThroughput(periodWindow);
      var throughputArray = weeklyThroughput.counts;
      var productivity = calculateProductivity(throughputArray) / people.length;
      var predictability = calculateStdDev(throughputArray) / calculateAverage(throughputArray);
      var week = moment(periodWindow[periodWindow.length-1].startDate, 'DD/MM/YYYY').add('1', 'week').format('DD/MM/YYYY');

      $scope.stats.push(
        {
          i: i++,
          week: week,
          identifier: "throughput" + week.replace(/\//g, 'gap'),
          people: people,
          issueCount: weeklyThroughput.issues[weeklyThroughput.issues.length - 1].length,
          bugCount: countBugs(weeklyThroughput.issues[weeklyThroughput.issues.length - 1]),
          magnitudes: weeklyThroughput.magnitudes,
          throughput: throughputArray,
          throughputDates: weeklyThroughput.dates,
          total: ss.sum(throughputArray),
          average: Math.round(calculateAverage(throughputArray)),
          stddev: Math.round(calculateStdDev(throughputArray)),
          productivity: productivity,
          predictability: predictability
        });
    });

    $scope.stat = $scope.stats[$scope.stats.length - 1];
    $scope.data = $scope.generateDataFromStat($scope.stats);

    $scope.loaded = true;
  });

  function countBugs(issues) {
    var bugCount = 0;
    _.each(issues, function(issue) {
      if(issue.fields.issuetype.name === 'Bug') {
        bugCount++;
      }
    });
    return bugCount;
  }

  function gatherIssueTime(issues) {

    _.each(issues.issueData, function(issue) {
      var startDate;
      _.each(issue.fields.subtasks, function(subtask) {
        if (subtask.fields.issuetype.name === "Design Review Sub-Task") {
          startDate = findStartDate(subtask.self);
        }
      });
      var closureDate = findIssueClosureDate(issue);
      console.log(startDate + ' to ' + closureDate);
    });
  }

  function findStartDate(issueUrl) {
    return "dunno";
  }

  function findIssueClosureDate(issue) {
    _.each(issue.changelog.histories, function(change) {
      _.each(change.items, function(item) {
        if (item.field === 'status' && (item.toString === 'Resolved' || item.toString === 'Closed')) {
          return change.created;
        }
      });
    });
  }

  function createWeekBuckets() {
    var endOfWeek = moment().endOf('week');
    var startOfBuckets = moment(endOfWeek).subtract('23', 'weeks');

    var buckets = [];
    var i = 0;
    while(startOfBuckets.isBefore(endOfWeek)) {
      buckets.push({i: i++, startDate: startOfBuckets.format('DD/MM/YYYY'), issues: []});
      startOfBuckets.add('1', 'week');
    }
    return buckets;
  }

  function putIssuesInBuckets(issue) {
    _.each($scope.allJiras.issues, function(issue) {
      var resolutionDate = moment(issue.fields.resolutiondate.substr(0, 10), 'YYYY-MM-DD');
      _.each($scope.weekBuckets, function(bucket) {
        if(resolutionDate.isAfter(moment(bucket.startDate, 'DD/MM/YYYY')) &&
          resolutionDate.isBefore(moment(bucket.startDate, 'DD/MM/YYYY').add('1', 'week'))) {
          bucket.issues.push(issue);
        }
      });
    });
  }

  function getPeriodWindows() {
    var windows = [];
    for (i = 0; i < $scope.weekBuckets.length-13; i++) {
      windows.push($scope.weekBuckets.slice(i, i+13));
    }
    return windows;
  }

  function getPeople(periodWindow) {

    var people = [];

    _.each(periodWindow, function(periodIssues) {
      _.each(periodIssues.issues, function(issue) {
        people.push(issue.fields.assignee);
      });
    });

    var uniquePeople = _.map(_.groupBy(people,function(person){
      return person.name;
    }),function(grouped){
      return grouped[0];
    });

    uniquePeople = _.without(uniquePeople, _.findWhere(uniquePeople, {displayName: "wyvern_team_a_backlog"}));
    uniquePeople = _.without(uniquePeople, _.findWhere(uniquePeople, {displayName: "wyvern_team_b_backlog"}));
    uniquePeople = _.without(uniquePeople, _.findWhere(uniquePeople, {displayName: "Wyvern CCB"}));
    uniquePeople = _.without(uniquePeople, _.findWhere(uniquePeople, {displayName: "wyvern_implementation_pool"}));

    return uniquePeople;
  }

  function getWeeklyThroughput(periodWindow) {

    var throughput = {
        magnitudes: [],
        counts: [],
        dates : [],
        issues: []
    };

    _.each(periodWindow, function(week) {
      var totalMagnitude = 0;
      for (i = 0; i < week.issues.length; i++) {
        var issue = week.issues[i];
        var magnitude = issue.fields["customfield_10494"];
        if(magnitude) {
          totalMagnitude += magnitude;
        }
      }

      throughput.magnitudes.push(totalMagnitude);
      throughput.counts.push(week.issues.length);
      throughput.issues.push(week.issues);
      throughput.dates.push(week.startDate);
    });

    return throughput;
  }

  function calculateProductivity(throughputArray, people) {
    return (ss.sum(throughputArray) / 13);
  }

  function calculateStdDev(throughputArray) {
    return ss.standard_deviation(throughputArray);
  }

  function calculateAverage(throughputArray) {
    return ss.average(throughputArray);
  }

}