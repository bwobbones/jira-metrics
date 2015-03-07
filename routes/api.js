var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var Client = require('node-rest-client').Client;
var moment = require('moment');

var restClient = new Client();

exports.throughputData = function (req, res) {

  console.log(req.query);

  var hostname = req.query.jiraHostName;
  var projects = req.query.projects;
  var issueTypes = req.query.issueTypes;
  var completionTypes = req.query.completionTypes;

  var query = "project in (" + projects.join(',') + ") AND issuetype in (" + issueTypes.join(',') + ") AND resolution in (" + completionTypes.join(',') + ") AND resolutiondate > endOfWeek(-23)";

  console.log('requesting ' + query);

  var args = {
    path: {},
    parameters: {},
    headers: {"Content-Type": "application/json"},
    requestConfig: {
      timeout: 10000
    },
    data: {
      "jql": query,
      "maxResults": 250
    }
  };

  console.log('making throughputData call to ' + hostname + '/rest/api/latest/search');

  restClient.post(hostname + '/rest/api/latest/search', args, function (data, response) {
    res.json(data);
  });

};

exports.currentSprint = function (req, res) {

  console.log(req.query);

  var hostname = req.query.jiraHostName;
  var projects = req.query.projects;
  var issueTypes = req.query.issueTypes;

  var query = "project in (" + projects.join(',') + ") AND issuetype in (" + issueTypes.join(',') + ") AND Sprint in openSprints()";

  console.log('requesting ' + query);

  var args = {
    path: {},
    parameters: {},
    headers: {"Content-Type": "application/json"},
    requestConfig: {
      timeout: 10000
    },
    data: {
      "jql": query,
      "maxResults": 250
    }
  };

  console.log('making currentSprint call to ' + hostname + '/rest/api/latest/search');

  restClient.post(hostname + '/rest/api/latest/search', args, function (data, response) {
    res.json(data);
  });

};


exports.allIssuesPerWeek = function (req, res) {

  var hostname = req.query.jiraHostName;
  var projects = req.query.projects;
  var issueTypes = req.query.issueTypes;
  var weekNumber = req.query.weekNumber;

  var query = 'project in (' + projects.join(",") + ') AND issuetype in (' + issueTypes.join(",") + ') AND status was in (Open) on endOfWeek(-' + weekNumber + ')';

  var args = {
    path: {},
    parameters: {},
    headers: {"Content-Type": "application/json"},
    requestConfig: {
      timeout: 10000
    },
    data: {
      "jql": query,
      "fields": ["key", "issuetype", "subtasks"],
      "maxResults": 1500
    }
  };

  restClient.post(hostname + '/rest/api/latest/search', args, function (data, response) {
    res.json(data);
  });

};

exports.issueDetail = function (req, res) {

  var issueUrl = req.params.issueUrl;

  restClient.get(issueUrl, function (data, response) {
    res.json(data);
  });

};

exports.xml = function (req, res) {
  var url = req.query.url;

  restClient.get(url, function (data, response) {
    res.set('Content-Type', 'text/xml');
    res.send(data);
  });
};