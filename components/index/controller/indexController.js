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

  $scope.allJiras = $resource('api/throughputData', {
        jiraHostName: config.jiraHostName,
        'projects[]': config.projects,
        'completionTypes[]': config.completionTypes,
        issueTypes: config.issueTypes
    }).get(function() {
    putIssuesInBuckets();    
    var periodWindows = getPeriodWindows();
    $scope.stats = [];
    _.each(periodWindows, function(periodWindow) {
      var people = getPeople(periodWindow);
      var throughputArray = getWeeklyThroughput(periodWindow);
      var productivity = calculateProductivity(throughputArray) / people.length;
      var predictability = calculateStdDev(throughputArray) / calculateAverage(throughputArray);
      var week = moment(periodWindow[periodWindow.length-1].startDate, 'DD/MM/YYYY').add('1', 'week').format('DD/MM/YYYY');
      $scope.stats.push(
        {        
          week: week, 
          identifier: "throughput" + week.replace(/\//g, 'gap'),
          people: people,           
          throughput: throughputArray,
          total: ss.sum(throughputArray),          
          average: Math.round(calculateAverage(throughputArray)),
          stddev: Math.round(calculateStdDev(throughputArray)),
          productivity: productivity, 
          predictability: predictability
        });
    });
  });  
  
  var issueQueries = [];
  for (var i = 0; i < 1; i++) {
    query = $resource('api/allIssuesPerWeek/:weekNumber', 
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

  $scope.issuesPerWeek = [];
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

    var throughputArray = [];

    _.each(periodWindow, function(week) {
      throughputArray.push(week.issues.length);
    });

    return throughputArray;
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