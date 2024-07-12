import * as waf from "aws-cdk-lib/aws-wafv2";

export const wafRules: waf.CfnWebACL.RuleProperty[] = [

  {
    name: "CUSTOM_reduce-surface-attack-apis",
    priority: 1,
    action: { block: {} },
    statement: {
      orStatement: {
        statements: [
          {
            byteMatchStatement: {
              fieldToMatch: { uriPath: {} },
              positionalConstraint: "STARTS_WITH",
              searchString: "/api/product",
              textTransformations: [
                {
                  priority: 0,
                  type: "LOWERCASE"
                }
              ]
            }
          },
          {
            byteMatchStatement: {
              fieldToMatch: { uriPath: {} },
              positionalConstraint: "STARTS_WITH",
              searchString: "/api/products",
              textTransformations: [
                {
                  priority: 0,
                  type: "LOWERCASE"
                }
              ]
            }
          },
        ]
      }

    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "reduce-surface-attack-apis",
    },
  },
  {
    name: "MANAGED_malicious-ips-vpn-tor-hosting-providers",
    priority: 2,
    statement: {
      managedRuleGroupStatement: {
        vendorName: "AWS",
        name: "AWSManagedRulesAnonymousIpList",
      },
    },
    overrideAction: { none: {} },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "MANAGED_malicious-ips-vpn-tor-hosting-providers",
    },
  },
  {
    name: "MANAGED_malicious-ips-ddos-scanners",
    priority: 3,
    statement: {
      managedRuleGroupStatement: {
        vendorName: "AWS",
        name: "AWSManagedRulesAmazonIpReputationList",
        ruleActionOverrides: [
          {
            actionToUse: {
              block: {}
            },
            name: 'AWSManagedIPDDoSList'
          },
        ]
      },
    },
    overrideAction: { none: {} },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "MANAGED_malicious-ips-ddos-scanners",
    },
  },
  {
    name: "CUSTOM_rate_limit_IP_400",
    priority: 4,
    statement: {
      rateBasedStatement: {
        aggregateKeyType: "IP",
        limit: 400,
        evaluationWindowSec: 60
      },
    },
    action: {
      block: {}
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "BlanketRateLimit",
    },
  },
  {
    name: "MANAGED_general_bot_protection",
    priority: 5,
    overrideAction: { none: {} },
    statement: {
      managedRuleGroupStatement: {
        vendorName: "AWS",
        name: "AWSManagedRulesBotControlRuleSet",
        managedRuleGroupConfigs: [
          {
            awsManagedRulesBotControlRuleSet: { inspectionLevel: "TARGETED" }
          }
        ],
        ruleActionOverrides: [
          {
            actionToUse: {
              block: {}
            },
            name: "TGT_TokenReuseIp"
          },
          {
            actionToUse: {
              captcha: {}
            },
            name: "TGT_ML_CoordinatedActivityHigh"
          },
        ],
      },
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "MANAGED_general_bot_protection",
    },
  },
  {
    name: "CUSTOM_block-requests-to-apis-with-non-valid-tokens",
    priority: 6,
    action: { block: {} },
    statement: {
      andStatement: {
        statements: [
          {
            orStatement: {
              statements: [
                {
                  labelMatchStatement: {
                    scope: 'LABEL',
                    key: 'awswaf:managed:token:absent'
                  }
                },
                {
                  labelMatchStatement: {
                    scope: 'LABEL',
                    key: 'awswaf:managed:token:rejected'
                  }
                }
              ]
            }
          },
          {
            orStatement: {
              statements: [
                {
                  byteMatchStatement: {
                    fieldToMatch: { uriPath: {} },
                    positionalConstraint: "STARTS_WITH",
                    searchString: "/api/login",
                    textTransformations: [
                      {
                        priority: 0,
                        type: "LOWERCASE"
                      }
                    ]
                  }
                },
                {
                  byteMatchStatement: {
                    fieldToMatch: { uriPath: {} },
                    positionalConstraint: "STARTS_WITH",
                    searchString: "/api/register",
                    textTransformations: [
                      {
                        priority: 0,
                        type: "LOWERCASE"
                      }
                    ]
                  }
                },
                {
                  byteMatchStatement: {
                    fieldToMatch: { uriPath: {} },
                    positionalConstraint: "STARTS_WITH",
                    searchString: "/api/profile",
                    textTransformations: [
                      {
                        priority: 0,
                        type: "LOWERCASE"
                      }
                    ]
                  }
                },
              ]
            }
          },
        ]
      }

    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "CUSTOM_block-requests-to-apis-with-non-valid-tokens",
    },
  },
  {
    name: "MANAGED_account-takover-prevention-login-api",
    priority: 7,
    statement: {
      managedRuleGroupStatement: {
        vendorName: "AWS",
        name: "AWSManagedRulesATPRuleSet",
        scopeDownStatement: {
          byteMatchStatement: {
            fieldToMatch: { uriPath: {} },
            positionalConstraint: "STARTS_WITH",
            searchString: "/api/login",
            textTransformations: [
              {
                priority: 0,
                type: "LOWERCASE"
              }
            ]
          }
        },
        managedRuleGroupConfigs: [
          {
            awsManagedRulesAtpRuleSet: {
              loginPath: '/api/login',
              requestInspection: {
                passwordField: {
                  identifier: '/password',
                },
                payloadType: 'JSON',
                usernameField: {
                  identifier: '/username',
                },
              },
              responseInspection: {
                statusCode: {
                  successCodes: [200],
                  failureCodes: [401]
                }
              }
            }
          }
        ]
      },
    },
    overrideAction: { none: {} },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "MANAGED_account-takover-prevention-login-api",
    },
  }
  , {
    name: "CUSTOM_block-logins-with-compromised-credentials",
    priority: 8,
    action: { block: {} },
    statement: {
      labelMatchStatement: {
        scope: 'LABEL',
        key: 'awswaf:managed:aws:atp:signal:credential_compromised'
      }
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "CUSTOM_block-logins-with-compromised-credentials",
    },
  },
  {
    name: "MANAGED_fake-account-creation-prevention",
    priority: 9,
    statement: {
      managedRuleGroupStatement: {
        vendorName: "AWS",
        name: "AWSManagedRulesACFPRuleSet",
        scopeDownStatement: {
          byteMatchStatement: {
            fieldToMatch: { uriPath: {} },
            positionalConstraint: "STARTS_WITH",
            searchString: "/api/register",
            textTransformations: [
              {
                priority: 0,
                type: "LOWERCASE"
              }
            ]
          }
        },
        managedRuleGroupConfigs: [
          {
            awsManagedRulesAcfpRuleSet: {
              creationPath: '/api/register',
              registrationPagePath: '/register',
              requestInspection: {
                passwordField: {
                  identifier: '/password',
                },
                payloadType: 'JSON',
                usernameField: {
                  identifier: '/username',
                },
                phoneNumberFields: [{
                  identifier: '/phone',
                }],
                addressFields: [{
                  identifier: '/address',
                }],
              },
              responseInspection: {
                statusCode: {
                  successCodes: [200],
                  failureCodes: [500]
                }
              }
            }
          }
        ]
      },
    },
    overrideAction: { none: {} },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "MANAGED_fake-account-creation-prevention",
    },
  },
  {
    name: "CUSTOM_block-account-creation-with-medium-volumetricsessionhigh",
    priority: 10,
    action: { block: {} },
    statement: {
      labelMatchStatement: {
        scope: 'LABEL',
        key: 'awswaf:managed:aws:acfp:aggregate:volumetric:session:creation:medium'
      }
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "CUSTOM_block-account-creation-with-medium-volumetricsessionhigh",
    },
  }
] as const;