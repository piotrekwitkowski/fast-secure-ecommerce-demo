import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { AwsCustomResource, PhysicalResourceId, AwsCustomResourcePolicy } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';


const GITHUB_REPO = 'https://github.com/achrafsouk/recycle-bin-boutique';
const SECRET_KEY = 'd34fFWEesds43fsFDsdf';
const products = [
  { id: 'eco-friendly-bottle-15345', name: 'Eco-friendly Water Bottle', price: 19.99, image: 'images/eco-friendly.jpeg', description: 'A great bottle for hydrating your self and protecting the nature' },
  { id: 'organic-tshirt-74743', name: 'Organic Cotton T-shirt', price: 29.99, image: 'images/organic-tshirt.jpeg', description: 'For sensitive skins and eco conscious fashion lovers.' },
  { id: 'recycled-paper-notebook-734743', name: 'Recycled Paper Notebook', price: 9.99, image: 'images/recycled-paper.jpeg', description: 'Save your thoughts, and save the environment from waste.' },
  { id: 'bamboo-cutlery-set-9584', name: 'Bamboo Cutlery Set', price: 49.99, image: 'images/bamboo-cutlery-set.jpeg', description: 'Portable and reusable utensils made from sustainable bamboo. Perfect for on-the-go meals and reducing plastic waste.' },
  { id: 'phone-charger-434834', name: 'Solar-Powered Phone Charger', price: 39.99, image: 'images/phone-charger.jpeg', description: 'Harness the sun energy to keep your devices charged. Ideal for outdoor enthusiasts and eco-conscious travelers.' },
  { id: 'beeswax-food-wraps-43774', name: 'Beeswax Food Wraps', price: 129.99, image: 'images/beeswax-food-wraps.jpeg', description: 'Reusable, biodegradable alternative to plastic wrap. Keeps food fresh naturally and reduces single-use plastic in your kitchen.' },
  { id: 'outdoor-rug-3347438', name: 'Recycled Plastic Outdoor Rug', price: 2.99, image: 'images/outdoor-rug.jpeg', description: 'Stylish and durable rug made from recycled plastic bottles. Perfect for patios and picnics while giving plastic waste a new life.' },
  { id: 'cotton-tote-bag-009833', name: 'Organic Cotton Tote Bag', price: 6.99, image: 'images/cotton-tote-bag.jpeg', description: 'Sturdy, washable shopping bag made from organic cotton. Reduces reliance on disposable bags and supports sustainable agriculture.' },
  { id: 'glass-cleaning-kit-4443', name: 'Refillable Glass Cleaning Kit', price: 0.99, image: 'images/glass-cleaning-kit.jpeg', description: 'All-purpose cleaner in a reusable glass bottle with concentrated refills. Effective cleaning power with less packaging waste.' },
];

export class StoreInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
            [usersTable.tableName] : [
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
        physicalResourceId: PhysicalResourceId.of('initDDBresourc'),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({  //wtf?
        resources: AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    const originalImageBucket = new cdk.aws_s3.Bucket(this, 's3-sample-original-image-bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      autoDeleteObjects: true,
    });

    new cdk.aws_s3_deployment.BucketDeployment(this, 'ProductImages', {
      sources: [cdk.aws_s3_deployment.Source.asset('../assets/images')],
      destinationBucket: originalImageBucket,
      destinationKeyPrefix: 'images/',
    });

    // Create a VPC (or use an existing one)
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

    // Create a security group
    const securityGroup = new ec2.SecurityGroup(this, 'MySecurityGroup', {
      vpc,
      description: 'Allow port 3000 from CloudFront IP ranges',
      allowAllOutbound: true
    });

    // Add SG ingress rules TODO update to CloudFront only
    securityGroup.addIngressRule(
      ec2.Peer.ipv4('0.0.0.0/0'),
      ec2.Port.tcp(3000),
      'Allow port 3000 from CloudFront'
    );
    securityGroup.addIngressRule( //remove
      ec2.Peer.ipv4('0.0.0.0/0'),
      ec2.Port.tcp(22),
      'Allow SSH'
    );

    // Create an IAM role for the EC2 instance
    const role = new iam.Role(this, 'MyEC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    // Add DynamoDB read/write permissions to the role
    const table_products = dynamodb.Table.fromTableName(this, 'store_products_table', 'test_products');
    table_products.grantReadWriteData(role);
    productsTable.grantReadWriteData(role);

    usersTable.grantReadWriteData(role);

    // Get the latest Ubuntu AMI
    const ubuntu = ec2.MachineImage.fromSsmParameter(
      '/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id',
      { os: ec2.OperatingSystemType.LINUX }
    );

    // Create the EC2 instance
    const instance = new ec2.Instance(this, 'store_backend_ec2', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
      machineImage: ubuntu,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: securityGroup,
      role: role,
      associatePublicIpAddress: true,
    });

    // Add user data (you can modify this later)
    instance.addUserData(
      '#!/bin/bash',
      'sudo apt update',
      'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -',
      'sudo apt-get install -y nodejs',
      'sudo npm install -g npm@latest',
      'sudo npm install pm2 -g',
      `git clone ${GITHUB_REPO}`,
      'cd recycle-bin-boutique/store-app',
      `echo '{"products_ddb_table" : "${productsTable.tableName}", "users_ddb_table": "${usersTable.tableName}","login_secret_key": "${SECRET_KEY}","aws_region": "${this.region}"}' > aws-backend-config.json`, 
      'npm install',
      'npm run build',
      'pm2 start npm --name nextjs-app -- run start -- -p 3000'
    );

    const cdn = new cdk.aws_cloudfront.Distribution(this, 'store-cdn', {
      comment: 'CloudFront to serve the Recycle Bin Boutique',
      defaultBehavior: {
        origin: new cdk.aws_cloudfront_origins.HttpOrigin(instance.instancePublicDnsName, {
          httpPort: 3000,
          protocolPolicy: cdk.aws_cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cdk.aws_cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
      },
      additionalBehaviors: {
        '/images/*': {
          origin: new cdk.aws_cloudfront_origins.S3Origin(originalImageBucket),
          viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
        },
      },
      
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      description: 'CloudFront domain name of the Recycle Bin Boutique',
      value: cdn.distributionDomainName
    });

  }
}
