import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from '@aws-sdk/util-dynamodb'
import config from '../../aws-backend-config.json';

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: config.aws_region,
});

const docClient = DynamoDBDocumentClient.from(client);

export default async function handler(req, res) {

  try {
    const command = new GetItemCommand({
      'TableName': config.products_ddb_table,
      'Key': {
        'id' : {
          'S': req.query.id
        }
      }
    });

    const response = await docClient.send(command);
    

    res.status(200).json(unmarshall(response.Item));
  } catch (error) {
    console.error('Error fetching products from DynamoDB:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
}