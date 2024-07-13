import { isAuthenticated } from '../utils/auth';
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from '@aws-sdk/util-dynamodb'
import config from '../aws-backend-config.json';

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: config.aws_region,
});

const docClient = DynamoDBDocumentClient.from(client);


export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end(); // Method Not Allowed
  }

  if (!isAuthenticated(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const username = req.query.username;

  const command = new GetItemCommand({
    'TableName': config.users_ddb_table,
    'Key': {
      'username' : {
        'S': username
      }
    }
  });

  const response = await docClient.send(command);

  if (response.Item) {
    res.status(200).json(unmarshall(response.Item));
  } else {
    res.status(401).json({ message: 'User not found' });
  }


}
