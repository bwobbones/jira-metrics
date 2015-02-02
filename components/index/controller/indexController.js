angularModules.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
  $stateProvider
    .state('index', {
      url: '/',
      views: {
        "searchPanel": {templateUrl: "partials/index/metrics", controller: IndexCtrl}
      }
    });
});

function IndexCtrl($scope, $rootScope, $state, $resource, $q, config, _) {

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
                //area: true
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

  $scope.options = {
      chart: {
          type: 'lineChart',
          //type: 'multiBarChart',
          height: 500,
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

  $scope.allJiras = $resource('api/throughputData', {
        jiraHostName: config.jiraHostName,
        'projects[]': config.projects,
        'completionTypes[]': config.completionTypes,
        issueTypes: config.issueTypes
    }).get(function() {
    putIssuesInBuckets();
    var periodWindows = getPeriodWindows();
    $scope.stats = [];
    var data = [];
    _.each(periodWindows, function(periodWindow) {
      var people = getPeople(periodWindow);
      var weeklyThroughput = getWeeklyThroughput(periodWindow);
      var throughputArray = weeklyThroughput.counts;
      var productivity = calculateProductivity(throughputArray) / people.length;
      var predictability = calculateStdDev(throughputArray) / calculateAverage(throughputArray);
      var week = moment(periodWindow[periodWindow.length-1].startDate, 'DD/MM/YYYY').add('1', 'week').format('DD/MM/YYYY');
      $scope.stats.push(
        {
          week: week,
          identifier: "throughput" + week.replace(/\//g, 'gap'),
          people: people,
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
  });

  var issueQueries = [];
  $scope.issuesPerWeek = [];
  for (var i = 0; i < 1; i++) {
    query = $resource('api/allIssuesPerWeek/',
      {
        weekNumber: i.toString(),
        jiraHostName: config.jiraHostName,
        'projects[]': config.projects,
        issueTypes: config.issueTypes
      })
      .get(function(data) {
        $scope.issuesPerWeek.push({weekNumber: '0', issueData: data.issues})
      }).$promise;
      issueQueries.push(query);
  }

  $q.all(issueQueries).then(function() {
    _.each($scope.issuesPerWeek, function(issues) {
      var bugCount = countBugs(issues);
      //gatherIssueTime(issues);
      putIssueListInStats(issues, bugCount);
    });
  });

  function countBugs(issues) {
    var bugCount = 0;
    _.each(issues.issueData, function(issue) {
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

  function putIssueListInStats(issues, bugCount) {
    var endOfWeek = moment().endOf('week');
    var issueCountWeek = moment(endOfWeek).subtract(issues.weekNumber, 'weeks');
    _.each($scope.stats, function(stat) {
      if(stat.week === issueCountWeek.format('DD/MM/YYYY')) {
        stat.issueCountPerWeek = issues.issueData.length;
        stat.bugCount = bugCount;
      }
    });
  }

  function createWeekBuckets() {
    var endOfWeek = moment().endOf('week');
    endOfWeek = endOfWeek.add('1', 'week');
    var startOfBuckets = moment(endOfWeek).subtract('23', 'weeks');

    var buckets = [];
    while(startOfBuckets.isBefore(endOfWeek)) {
      buckets.push({startDate: startOfBuckets.format('DD/MM/YYYY'), issues: []});
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
        people.push(issue.fields.assignee.displayName);
      });
    });

    people = _.uniq(people);
    people = _.without(people, "wyvern_team_b_backlog", "Wyvern CCB", "wyvern_implementation_pool");

    return people;
  }

  function getWeeklyThroughput(periodWindow) {

    var throughput = {
        magnitudes: [],
        counts: [],
        dates : []
    };

    _.each(periodWindow, function(week) {
      var totalMagnitude = 0;
      for (i = 0; i < week.issues.length; i++) {
        var issue = week.issues[i];
        var magnitude = issue.fields["customfield_10494"];
        if(magnitude) {
          //console.log(issue);
          totalMagnitude += magnitude;
        }
      }
      throughput.magnitudes.push(totalMagnitude);
      throughput.counts.push(week.issues.length);
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