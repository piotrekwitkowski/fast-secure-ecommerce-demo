import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from '@aws-sdk/util-dynamodb'
import config from '../../aws-backend-config.json';

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: config.aws_region,
});

const docClient = DynamoDBDocumentClient.from(client);


export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {

      const command = new QueryCommand({
        'TableName': config.comments_ddb_table,
        'KeyConditionExpression': "productid = :pid",
        'ExpressionAttributeValues': {
          ':pid': {
            "S": req.query.productId
          }
        }
      });
    
      const response = await docClient.send(command);
      console.log(response.Items);
      const unmarshalled = response.Items.map((i) => unmarshall(i));

      res.status(200).json(unmarshalled);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'comments couldn\'t be retrieved' });
    }
  } else if (req.method === 'POST') {
    const { username, text, productid, timestamp } = req.body;
    if (!username || !text || !productid || !timestamp) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const command = new PutItemCommand({
      'TableName': config.comments_ddb_table,
      'Item': {
        'username': {
          'S': username
        },
        'productid': {
          'S': productid
        },
        'text': {
          'S': text
        },
        'timestamp': {
          'N': `${timestamp}`
        },
      }
    });
    try {
      await docClient.send(command);
      res.status(200).json({ message: 'comment added successfully' });

    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'comment couldn\'t be added' });
    }
  } return res.status(400).json({ message: 'Bad request' });


}
