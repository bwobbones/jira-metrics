appServices.factory('Statistics', function ($resource, config) {

  function generateStatsFromPeriodWindows(periodWindows) {
    var data = [];
    var i = 0;
    _.each(periodWindows, function(periodWindow) {
      var people = getPeopleFromWindow(periodWindow);
      var weeklyThroughput = getWeeklyThroughput(periodWindow);
      var throughputArray = weeklyThroughput.counts;
      var productivity = calculateProductivity(throughputArray) / people.length;
      var predictability = calculateStdDev(throughputArray) / calculateAverage(throughputArray);
      var week = moment(periodWindow[periodWindow.length-1].startDate, 'DD/MM/YYYY').add('1', 'week').format('DD/MM/YYYY');

      data.push(
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

    return data;
  }

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
    var numberOfWeeks = 23;

    // The Graph should show up-to last week, except on Friday where it should include the current week.
    // So we add 2 days to the current date before calculating the endOf the week
    var endOfWeek = moment().add('2', 'days').endOf('week');
    var startOfBucket = moment(endOfWeek).subtract(numberOfWeeks, 'weeks');

    var buckets = [];
    for(var i = 0; i < numberOfWeeks; i++) {
      buckets.push({i: i, startDate: startOfBucket.format('DD/MM/YYYY'), issues: []});
      startOfBucket.add('1', 'week');
    }
    return buckets;
  }

  function generateResolvedBucketsFromIssues(issues) {
    var weekBuckets = createWeekBuckets();
    _.each(issues, function(issue) {
      var resolutionDate = moment(issue.fields.resolutiondate.substr(0, 10), 'YYYY-MM-DD');
      _.each(weekBuckets, function(bucket) {
        if(resolutionDate.isAfter(moment(bucket.startDate, 'DD/MM/YYYY')) &&
          resolutionDate.isBefore(moment(bucket.startDate, 'DD/MM/YYYY').add('1', 'week'))) {
          bucket.issues.push(issue);
        }
      });
    });

    return weekBuckets;
  }

  function generateCreatedBucketsFromIssues(issues) {
    var weekBuckets = createWeekBuckets();
    _.each(issues, function(issue) {
      var resolutionDate = moment(issue.fields.created.substr(0, 10), 'YYYY-MM-DD');
      _.each(weekBuckets, function(bucket) {
        if(resolutionDate.isAfter(moment(bucket.startDate, 'DD/MM/YYYY')) &&
          resolutionDate.isBefore(moment(bucket.startDate, 'DD/MM/YYYY').add('1', 'week'))) {
          bucket.issues.push(issue);
        }
      });
    });

    return weekBuckets;
  }

  function getPeriodWindows(weekBuckets) {
    var windows = [];
    for (i = 0; i < weekBuckets.length-13; i++) {
      windows.push(weekBuckets.slice(i, i+13));
    }
    return windows;
  }

  function getPeopleFromIssues(issues) {

    var people = [];
    _.each(issues, function(issue) {
      people.push(issue.fields.assignee);
    });

    return getUniquePeople(people);
  }

  function getPeopleFromWindow(periodWindow) {

    var people = [];
    _.each(periodWindow, function(periodIssues) {
      _.each(periodIssues.issues, function(issue) {
        people.push(issue.fields.assignee);
      });
    });

    return getUniquePeople(people);
  }

  function getUniquePeople(people) {
    var uniquePeople = _.map(_.groupBy(people,function(person){
      return person.name;
    }),function(grouped){
      return grouped[0];
    });

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

  function generateGraphDataFromStat(stats) {
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
        type: format(throughput, 'issue', 'issues'),
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
                key: 'JIRAs Resolved',
                area: true
            },
            {
                values: peopleData,
                key: 'People',
            },
            {
                values: magnitudes,
                key: 'Story Points Completed',
            },
          ],

          predictabilityProductivity: [
            {
                values: productivityData,
                key: 'Productivity',
                area: true
            },
            {
                values: predictabilityData,
                key: 'Predictability',
                area: true
            },
            {
                values: velocities,
                key: 'Velocity',
                area: true
            },
          ]
        };
  };

  function generateCreatedVsResolvedData(createdBuckets, resolvedBuckets) {
    var createdData = [];
    var resolvedData = [];

    function addBucketCountTo(data) {
      var i = 0;
      var previousValue = 0;
      return function(bucket) {
        var count = previousValue + bucket.issues.length;
        previousValue = count;

        var date =  bucket.startDate;
        data.push({
          week: date,
          weekNumber: i++,
          type: format(count, 'issue', 'issues'),
          value: count
        });
      }
    }

    _.each(createdBuckets, addBucketCountTo(createdData));
    _.each(resolvedBuckets, addBucketCountTo(resolvedData));

    return [
            {
                values: createdData,
                key: 'Created',
                color: '#d62728',
                //area: true
            },
            {
                values: resolvedData,
                key: 'Resolved',
                color: '#2ca02c',
                //area: true
            },
          ]
  }

  function format(count, one, many) {
    return (count == 1 ? one : many);
  }

  function generateStatsFromBuckets(weeklyBuckets) {
        var periodWindows = getPeriodWindows(weeklyBuckets);
        var stats = generateStatsFromPeriodWindows(periodWindows);

        return stats;
      }

  return {
      generateResolvedBucketsFromIssues: generateResolvedBucketsFromIssues,
      generateCreatedBucketsFromIssues: generateCreatedBucketsFromIssues,
      generateStatsFromBuckets: generateStatsFromBuckets,
      generateGraphDataFromStat: generateGraphDataFromStat,
      generateCreatedVsResolvedData: generateCreatedVsResolvedData,
      getPeopleFromIssues: getPeopleFromIssues,
  };
});