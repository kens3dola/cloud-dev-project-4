import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)

// TODO: Implement the fileStogare logic

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const logger = createLogger('AttachmentUtils')
const bucket = process.env.TODOS_S3_BUCKET
const expiration = process.env.SIGNED_URL_EXPIRATION

// TODO: Implement the dataLayer logic
export class AttachmentUtils {
  constructor(
    private readonly todoTable = process.env.TODOS_TABLE,
    private readonly docClient: DocumentClient = createDynamoDBClient()
  ) {}

  async createAttachmentPresignedUrl(todoId: string) {
    logger.info('Getting upload url todoId: ', todoId)
    try {
      return await s3.getSignedUrl('putObject', {
        Bucket: bucket,
        Key: todoId,
        Expires: parseInt(expiration)
      })
    } catch (error) {
      logger.error('Error get signed url: ' + JSON.stringify(error))
    }
  }
  async updateTodoAttachmentUrl(
    todoId: string,
    attachmentUrl: string,
    userId: string
  ) {
    await this.docClient
      .update({
        TableName: this.todoTable,
        Key: {
          todoId: todoId,
          userId: userId
        },
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl
        }
      })
      .promise()
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new AWS.DynamoDB.DocumentClient()
}
