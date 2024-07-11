import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cforigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as waf from "aws-cdk-lib/aws-wafv2";
import { AwsCustomResource, PhysicalResourceId, AwsCustomResourcePolicy } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

// TODO move to config file
const GITHUB_REPO = 'https://github.com/achrafsouk/recycle-bin-boutique';
const SECRET_KEY = 'd34fFWEesds43fsFDsdf';
const products = [
  { id: 'eco-friendly-bottle-15345', name: 'Eco-friendly Water Bottle', price: 19.99, image: '/images/eco-friendly.jpeg', description: 'A great bottle for hydrating your self and protecting the nature' },
  { id: 'organic-tshirt-74743', name: 'Organic Cotton T-shirt', price: 29.99, image: '/images/organic-tshirt.jpeg', description: 'For sensitive skins and eco conscious fashion lovers.' },
  { id: 'recycled-paper-notebook-734743', name: 'Recycled Paper Notebook', price: 9.99, image: '/images/recycled-paper.jpeg', description: 'Save your thoughts, and save the environment from waste.' },
  { id: 'bamboo-cutlery-set-9584', name: 'Bamboo Cutlery Set', price: 49.99, image: '/images/bamboo-cutlery-set.jpeg', description: 'Portable and reusable utensils made from sustainable bamboo. Perfect for on-the-go meals and reducing plastic waste.' },
  { id: 'phone-charger-434834', name: 'Solar-Powered Phone Charger', price: 39.99, image: '/images/phone-charger.jpeg', description: 'Harness the sun energy to keep your devices charged. Ideal for outdoor enthusiasts and eco-conscious travelers.' },
  { id: 'beeswax-food-wraps-43774', name: 'Beeswax Food Wraps', price: 129.99, image: '/images/beeswax-food-wraps.jpeg', description: 'Reusable, biodegradable alternative to plastic wrap. Keeps food fresh naturally and reduces single-use plastic in your kitchen.' },
  { id: 'outdoor-rug-3347438', name: 'Recycled Plastic Outdoor Rug', price: 2.99, image: '/images/outdoor-rug.jpeg', description: 'Stylish and durable rug made from recycled plastic bottles. Perfect for patios and picnics while giving plastic waste a new life.' },
  { id: 'cotton-tote-bag-009833', name: 'Organic Cotton Tote Bag', price: 6.99, image: '/images/cotton-tote-bag.jpeg', description: 'Sturdy, washable shopping bag made from organic cotton. Reduces reliance on disposable bags and supports sustainable agriculture.' },
  { id: 'glass-cleaning-kit-4443', name: 'Refillable Glass Cleaning Kit', price: 0.99, image: '/images/glass-cleaning-kit.jpeg', description: 'All-purpose cleaner in a reusable glass bottle with concentrated refills. Effective cleaning power with less packaging waste.' },
];
var S3_TRANSFORMED_IMAGE_EXPIRATION_DURATION = '90';
var S3_TRANSFORMED_IMAGE_CACHE_TTL = 'max-age=31622400';
var LAMBDA_MEMORY = '1500';
var LAMBDA_TIMEOUT = 60;
const wafDefaultRules = [
  {
    Rule: {
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
  },
  {
    Rule: {
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
    }
  },
  {
    Rule: {
      name: "MANAGED_malicious-ips-ddos-scanners",
      priority: 3,
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesAmazonIpReputationList",
        },
      },
      overrideAction: { none: {} },
      ruleActionOverrides: [
        {
          actionToUse: {
            block: {}
          },
          name: 'AWSManagedIPDDoSList'
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: "MANAGED_malicious-ips-ddos-scanners",
      },
    }
  },
  {
    Rule: {
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
    }
  },

  {
    Rule: {
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
          ]
        },
      },
      ruleActionOverrides: [
        {
          actionToUse: {
            block: {}
          },
          name: "TGT_TokenReuseIp"
        },
        {
          actionToUse: {
            catpcha: {}
          },
          name: "TGT_ML_CoordinatedActivityHigh"
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: "MANAGED_general_bot_protection",
      },
    }
  },
  {
    Rule: {
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
  },
  {
    Rule: {
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
  },
  {
    Rule: {
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
  },
  {
    Rule: {
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
    }
  },
  {
    Rule: {
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
    },
  },
];

export class StoreInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DyanmoDB tables to store users and prodcts data
    const usersTable = new dynamodb.Table(this, "usersTable", {
      partitionKey: {
        name: "username",
        type: dynamodb.AttributeType.STRING
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const productsTable = new dynamodb.Table(this, "productsTable", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // fill tables with initial data
    new AwsCustomResource(this, 'initDDBresource', {
      onCreate: {
        service: 'DynamoDB',
        action: 'BatchWriteItem',
        parameters: {
          RequestItems: {
            [productsTable.tableName]: products.map(product => ({
              PutRequest: {
                Item: {
                  id: { S: product.id },
                  name: { S: product.name },
                  description: { S: product.description },
                  price: { N: `${product.price}` },
                  image: { S: product.image },
                }
              }
            })),
            [usersTable.tableName]: [
              {
                PutRequest: {
                  Item: {
                    username: { S: 'demo' },
                    phone: { S: '00971546352343' },
                    password: { S: 'demo' },
                    address: { S: 'where all demos live on AWS' },
                  }
                }
              }

            ]
          }
        },
        physicalResourceId: PhysicalResourceId.of('initDDBresource'),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE, //TODO make it more restrictive
      }),
    });

    // S3 bucket holding original images
    const originalImageBucket = new cdk.aws_s3.Bucket(this, 's3-sample-original-image-bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      autoDeleteObjects: true,
    });

    // adding initial images to it
    new cdk.aws_s3_deployment.BucketDeployment(this, 'ProductImages', {
      sources: [cdk.aws_s3_deployment.Source.asset('../assets/images')],
      destinationBucket: originalImageBucket,
      destinationKeyPrefix: 'images/',
    });

    // S3 bucket holding trasnformed images (resized and reformatted)
    const transformedImageBucket = new s3.Bucket(this, 's3-transformed-image-bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(parseInt(S3_TRANSFORMED_IMAGE_EXPIRATION_DURATION)),
        },
      ],
    });

    // Create Lambda URL for image processing
    var imageProcessing = new lambda.Function(this, 'image-optimization-lambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('functions/image-processing-lambda'),
      timeout: cdk.Duration.seconds(LAMBDA_TIMEOUT),
      memorySize: parseInt(LAMBDA_MEMORY),
      environment: {
        originalImageBucketName: originalImageBucket.bucketName,
        transformedImageCacheTTL: S3_TRANSFORMED_IMAGE_CACHE_TTL,
        transformedImageBucketName: transformedImageBucket.bucketName
      },
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
    });
    // IAM policy to allow this lambda to read/write images from the relevant buckets
    const s3ReadOriginalImagesPolicy = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: ['arn:aws:s3:::' + originalImageBucket.bucketName + '/*'],
    });

    var s3WriteTransformedImagesPolicy = new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      resources: ['arn:aws:s3:::' + transformedImageBucket.bucketName + '/*'],
    });
    var iamPolicyStatements = [s3ReadOriginalImagesPolicy, s3WriteTransformedImagesPolicy];

    imageProcessing.role?.attachInlinePolicy(
      new iam.Policy(this, 'read-write-bucket-policy', {
        statements: iamPolicyStatements,
      }),
    );
    const imageProcessingURL = imageProcessing.addFunctionUrl();
    const imageProcessingDomainName = cdk.Fn.parseDomainName(imageProcessingURL.url);

    // Create a CloudFront Function for detecting optimal format, validating inputs and rewriting url
    const imageURLformatting = new cloudfront.Function(this, 'imageURLformatting', {
      code: cloudfront.FunctionCode.fromFile({ filePath: 'functions/cloudfront-function-url-formatting/index.js' }),
      functionName: `imageURLformatting${this.node.addr}`,
    });

    // Create a VPC
    const vpc = new ec2.Vpc(this, 'store_vpc', {
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ]
    });


    // Create a security group locked to CloudFront IPs
    // first get the CloudFront prefix list in the CDK deployment region using a custom resource

    const prefixListId = new AwsCustomResource(this, 'GetPrefixListId', {
      onCreate: {
        service: 'EC2',
        action: 'DescribeManagedPrefixListsCommand',
        parameters: {
          Filters: [
            {
              Name: 'prefix-list-name',
              Values: ['com.amazonaws.global.cloudfront.origin-facing'],
            },
          ],
        },
        physicalResourceId: PhysicalResourceId.of('GetPrefixListId'),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE,//TODO make it more restrictive
      }),
    }).getResponseField('PrefixLists.0.PrefixListId');

    const securityGroup = new ec2.SecurityGroup(this, 'MySecurityGroup', {
      vpc,
      description: 'Allow access from CloudFront IPs on port 3000, and any IP on port 22',
      allowAllOutbound: true
    });
    securityGroup.addIngressRule(
      ec2.Peer.prefixList(prefixListId),
      ec2.Port.tcp(3000),
      'Allow port 3000 on IPv4 from CloudFront '
    );
    // For troubleshooting, but in real world it would be restrcited.
    securityGroup.addIngressRule(
      ec2.Peer.ipv4('0.0.0.0/0'),
      ec2.Port.tcp(22),
      'Allow SSH'
    );

    // Create an IAM role for the EC2 instance with DynamoDB read/write permissions to the role
    const role = new iam.Role(this, 'MyEC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    productsTable.grantReadWriteData(role);
    usersTable.grantReadWriteData(role);

    // Get the latest Ubuntu AMI and Create the EC2 instance
    const ubuntu = ec2.MachineImage.fromSsmParameter(
      '/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id',
      { os: ec2.OperatingSystemType.LINUX }
    );
    const instance = new ec2.Instance(this, 'store_backend_ec2', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
      machineImage: ubuntu,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: securityGroup,
      role: role,
      associatePublicIpAddress: true,
    });

    // Create a WebACL and populate it with rules
    const webACLName = 'RecycleBinBoutiqueACL';
    const webACL = new waf.CfnWebACL(this, "webACL", {
      name: webACLName,
      defaultAction: { allow: {} },
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "RecycleBinBoutiqueACL",
        sampledRequestsEnabled: true,
      },
      rules: wafDefaultRules.map((wafRule) => wafRule.Rule),
    });

    // Get the url used for the Client side javascript integration
    const wafCR = new AwsCustomResource(this, 'WAFproperties', {
      onCreate: {
        service: 'WAFv2',
        action: 'GetWebACL',
        parameters: {
          Id: webACL.attrId,
          Name: webACLName,
          Scope: 'CLOUDFRONT'
        },
        outputPaths: ['ApplicationIntegrationURL'],
        physicalResourceId: PhysicalResourceId.of('WAFproperties'),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE, //TODO make it more restrictive
      }),
    });
    const wafIntegrationURL = wafCR.getResponseField('ApplicationIntegrationURL');

    // Script to bootstrap the Nextjs app on EC2
    instance.addUserData(
      '#!/bin/bash',
      'sudo apt update',
      'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -',
      'sudo apt-get install -y nodejs',
      'sudo npm install -g npm@latest',
      'sudo npm install pm2 -g',
      `git clone ${GITHUB_REPO}`,
      'cd recycle-bin-boutique/store-app',
      `echo '{"products_ddb_table" : "${productsTable.tableName}", "users_ddb_table": "${usersTable.tableName}","login_secret_key": "${SECRET_KEY}","aws_region": "${this.region}", "waf_url": "${wafIntegrationURL}challenge.compact.js"}' > aws-backend-config.json`,
      'npm install',
      'npm run build',
      'pm2 start npm --name nextjs-app -- run start -- -p 3000'
    );

    // Create a CloudFront distribution TODO add security headers
    const cdn = new cloudfront.Distribution(this, 'store-cdn', {
      comment: 'CloudFront to serve the Recycle Bin Boutique',
      webAclId: webACL.attrArn,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      defaultBehavior: {
        origin: new cforigins.HttpOrigin(instance.instancePublicDnsName, {
          httpPort: 3000,
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      },
      additionalBehaviors: {
        '/images/*': {
          origin: new cforigins.OriginGroup({
            primaryOrigin: new cforigins.S3Origin(transformedImageBucket),
            fallbackOrigin: new cforigins.HttpOrigin(imageProcessingDomainName),
            fallbackStatusCodes: [403, 500, 503, 504],
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
          functionAssociations: [{
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            function: imageURLformatting,
          }],
        },
      },

    });

    // ADD OAC between CloudFront and LambdaURL
    const oac = new cloudfront.CfnOriginAccessControl(this, "OAC", {
      originAccessControlConfig: {
        name: `oac${this.node.addr}`,
        originAccessControlOriginType: "lambda",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      },
    });
    const cfnImageDelivery = cdn.node.defaultChild as cloudfront.CfnDistribution;
    cfnImageDelivery.addPropertyOverride('DistributionConfig.Origins.2.OriginAccessControlId', oac.getAtt("Id"));
    imageProcessing.addPermission("AllowCloudFrontServicePrincipal", {
      principal: new iam.ServicePrincipal("cloudfront.amazonaws.com"),
      action: "lambda:InvokeFunctionUrl",
      sourceArn: `arn:aws:cloudfront::${this.account}:distribution/${cdn.distributionId}`
    })

    // Output cloudfront domain name
    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      description: 'CloudFront domain name of the Recycle Bin Boutique',
      value: cdn.distributionDomainName
    });

  }
}
