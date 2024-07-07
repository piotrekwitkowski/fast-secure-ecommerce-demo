import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import config from '../../aws-backend-config.json';

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: config.aws_region,
});

const docClient = DynamoDBDocumentClient.from(client);


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Method Not Allowed
  }

  const { username, password, phone, address } = req.body;

  // Basic validation
  if (!username || !password || !phone || !address) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  /* Check if user already exists
  if (users.find(user => user.username === username)) {
    return res.status(409).json({ message: 'Username already exists' });
  }*/

  const command = new PutItemCommand({
    'TableName': config.users_ddb_table,
    'Item': {
      'username' : {
        'S': username
      }, 
      'password' : {
        'S': password
      }, 
      'phone' : {
        'S': phone
      }, 
      'address' : {
        'S': address
      }, 
    }
  });

  try {
    await docClient.send(command);
    res.status(200).json({ message: 'User registered successfully'});

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'User registeration failed'});
  }
}
  