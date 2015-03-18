appServices.factory('JIRA', function ($resource, config) {
    return {
        throughputData: $resource('api/throughputData', {
                            jiraHostName: config.jiraHostName,
                            'projects[]': config.projects,
                            'completionTypes[]': config.completionTypes,
                            issueTypes: config.issueTypes
                          },
                          {
                            get : {
                                    method : 'GET',
                                    cache: true
                                }
                         }),

        currentSprint: $resource('api/currentSprint', {
                              jiraHostName: config.jiraHostName,
                              'projects[]': config.projects,
                              issueTypes: config.issueTypes,
                              search: 'Sprint in openSprints()',
                          },
                          {
                            get : {
                                    method : 'GET',
                                    cache: true
                                }
                         }),

        weeklyCreated: $resource('api/search', {
                              jiraHostName: config.jiraHostName,
                              'projects[]': config.projects,
                              issueTypes: config.issueTypes,
                              search: 'created >= "-7d 1h"',
                          },
                          {
                            get : {
                                    method : 'GET',
                                    cache: true
                                }
                         }),

        created: $resource('api/searchSimple', {
                              jiraHostName: config.jiraHostName,
                              'projects[]': config.projects,
                              issueTypes: config.issueTypes,
                              search: 'created >= endOfWeek(-23)',
                          },
                          {
                            get : {
                                    method : 'GET',
                                    cache: true
                                }
                         }),

        resolved: $resource('api/searchSimple', {
                              jiraHostName: config.jiraHostName,
                              'projects[]': config.projects,
                              issueTypes: config.issueTypes,
                              search: 'resolutiondate >= endOfWeek(-23)',
                          },
                          {
                            get : {
                                    method : 'GET',
                                    cache: true
                                }
                         }),
    };
});