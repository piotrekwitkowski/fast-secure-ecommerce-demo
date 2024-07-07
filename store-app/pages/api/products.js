import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import config from '../../aws-backend-config.json';

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: config.aws_region,
});

const docClient = DynamoDBDocumentClient.from(client);


export default async function handler(req, res) {
  try {
    const command = new ScanCommand({
      TableName: config.products_ddb_table,
    });

    const response = await docClient.send(command);
    

    res.status(200).json(response.Items);
  } catch (error) {
    console.error('Error fetching products from DynamoDB:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
}