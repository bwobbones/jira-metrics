var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var Client = require('node-rest-client').Client;
var moment = require('moment');
var cache = require('memory-cache');

var MINUTE_IN_MILLIS = 60 * 1000;
var HOUR_IN_MILLIS = 60 * MINUTE_IN_MILLIS;
var DAY_IN_MILLIS = 24 * HOUR_IN_MILLIS;

var restClient = new Client();

// Extracted from .env
var username = process.env.JIRA_USERNAME;
var password = process.env.JIRA_PASSWORD;
var auth = username ? 'Basic ' + new Buffer(username + ':' + password).toString('base64') : undefined;

function jiraPostRequest(res, jiraUrl, data, cacheTimeout) {
  var cacheKey = data.jql;

  var args = {
    path: {},
    parameters: {},
    headers: { "Content-Type": "application/json" },
    requestConfig: {
      timeout: 10000
    },
    data: data,
  };

  if(auth) {
    args.headers.Authorization = auth;
  }


  var cachedData = cache.get(cacheKey);
  if(cachedData) {
    console.log('Using cache for ' + cacheKey);
    res.status(304).json(cachedData);
    return;
  }

  console.log('Making call to ' + jiraUrl);
  restClient.post(jiraUrl, args, function (result, response) {
    cache.put(cacheKey, result, cacheTimeout);
    res.json(result);
  });
}

exports.throughputData = function (req, res) {

  var hostname = req.query.jiraHostName;
  var projects = req.query.projects;
  var issueTypes = req.query.issueTypes;
  var completionTypes = req.query.completionTypes;

  var query = "project in (" + projects.join(',') + ") AND issuetype in (" + issueTypes.join(',') + ") AND resolution in (" + completionTypes.join(',') + ") AND resolutiondate > endOfWeek(-23)";

  var data = {
    "jql": query,
    "maxResults": 250
  };

  jiraPostRequest(res, hostname + '/rest/api/latest/search', data, DAY_IN_MILLIS);
};

exports.currentSprint = function (req, res) {

  var hostname = req.query.jiraHostName;
  var projects = req.query.projects;
  var issueTypes = req.query.issueTypes;

  var query = "project in (" + projects.join(',') + ") AND issuetype in (" + issueTypes.join(',') + ") AND Sprint in openSprints()";

  var data = {
    "jql": query,
    "maxResults": 250
  };

  jiraPostRequest(res, hostname + '/rest/api/latest/search', data, HOUR_IN_MILLIS);
};


exports.allIssuesPerWeek = function (req, res) {

  var hostname = req.query.jiraHostName;
  var projects = req.query.projects;
  var issueTypes = req.query.issueTypes;
  var weekNumber = req.query.weekNumber;

  var query = 'project in (' + projects.join(",") + ') AND issuetype in (' + issueTypes.join(",") + ') AND status was in (Open) on endOfWeek(-' + weekNumber + ')';

  var data = {
    "jql": query,
    "fields": ["key", "issuetype", "subtasks"],
    "maxResults": 1500
  };

  jiraPostRequest(res, hostname + '/rest/api/latest/search', data, DAY_IN_MILLIS);
};

exports.search = function (req, res) {

  var hostname = req.query.jiraHostName;
  var projects = req.query.projects;
  var issueTypes = req.query.issueTypes;
  var search = req.query.search;

  var query = 'project in (' + projects.join(",") + ') AND issuetype in (' + issueTypes.join(",") + ') AND (' + search + ')';

  var data = {
    "jql": query,
    "maxResults": 250
  };

  jiraPostRequest(res, hostname + '/rest/api/latest/search', data, HOUR_IN_MILLIS);
};

exports.issueDetail = function (req, res) {

  var issueUrl = req.query.issueUrl || req.params["issueUrl"];

  console.log(issueUrl);
  restClient.get(issueUrl, function (data, response) {
    res.json(data);
  }, function(err) {
    console.log(err);
  });
};

exports.xml = function (req, res) {
  var url = req.query.url;

  var args = {
    headers: {}
  };

  if(auth) {
    args.headers.Authorization = auth;
  }

  restClient.get(url, args, function (data, response) {
    res.set('Content-Type', 'text/xml');
    res.send(data);
  });
};