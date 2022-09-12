import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { File } from '../models/File'
import { JsonWebTokenError } from 'jsonwebtoken'

const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const logger = createLogger('FilesAccess')
const bucket = process.env.S3_BUCKET
const expiration = process.env.SIGNED_URL_EXPIRATION

export class FilesAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly fileTable = process.env.FILES_TABLE
  ) {}

  async getAllFiles(userId: string) {
    logger.info('Get all Files for user')
    logger.info('Files of user ' + userId)
    const result = await this.docClient
      .query({
        TableName: this.fileTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false
      })
      .promise()
    const files = result.Items
    logger.info('Todos: ' + JSON.stringify(files as File[]))
    return files as File[]
  }

  async createFile(file: File): Promise<File> {
    logger.info('Creating file: ' + JSON.stringify(file))
    await this.docClient
      .put({
        TableName: this.fileTable,
        Item: file
      })
      .promise()
    return file
  }

  async deleteFile(fileId: string, userId: string) {
    logger.info('Userid: ', userId)
    logger.info('Deleting file id: ', fileId)
    try {
      await this.docClient
        .delete({
          TableName: this.fileTable,
          Key: {
            fileId: fileId,
            userId: userId
          }
        })
        .promise()
    } catch (error) {
      logger.error('Could not delete file: ', error.message)
    }
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
