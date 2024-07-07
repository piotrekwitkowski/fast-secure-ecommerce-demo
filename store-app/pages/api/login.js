import { sign } from 'jsonwebtoken';

import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from '@aws-sdk/util-dynamodb'
import config from '../../aws-backend-config.json';

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: config.aws_region,
});

const docClient = DynamoDBDocumentClient.from(client);

const SECRET_KEY =  config.login_secret_key; // In a real app, use an environment variable

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Method Not Allowed
  }

  const { username, password } = req.body;

  const command = new GetItemCommand({
    'TableName': config.users_ddb_table,
    'Key': {
      'username' : {
        'S': username
      }
    }
  });

  const response = await docClient.send(command);

  // In a real application, you would check these credentials against your database
  if (response.Item && unmarshall(response.Item).password === password) {
    const token = sign({ username }, SECRET_KEY, { expiresIn: '2h' });
    res.status(200).json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
}