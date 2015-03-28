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

        currentSprint: function(component) {
                          var search = 'Sprint in openSprints()';
                          if(component) {
                            search += ' AND component = "' + component + '"'
                          }

                          return $resource('api/search', {
                              jiraHostName: config.jiraHostName,
                              'projects[]': config.projects,
                              issueTypes: config.issueTypes,
                              search:  search,
                          },
                          {
                            get : {
                                    method : 'GET',
                                    cache: true
                                }
                         });
                        },

        dailyCreated: $resource('api/search', {
                              jiraHostName: config.jiraHostName,
                              'projects[]': config.projects,
                              issueTypes: config.issueTypes,
                              search: 'created >= "-1d 1h"',
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

        unfinishedJIRAs: $resource('api/unfinished', {
                              jiraHostName: config.jiraHostName,
                              'projects[]': config.projects
                          },
                          {
                            get : {
                                    method : 'GET',
                                    cache: true
                                }
                         }),
    };
});