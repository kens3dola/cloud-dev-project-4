import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const logger = createLogger('TodosAccess')
const bucket = process.env.ATTACHMENT_S3_BUCKET
const expiration = process.env.SIGNED_URL_EXPIRATION

// TODO: Implement the dataLayer logic
export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todoTable = process.env.TODOS_TABLE
  ) {}

  async getAllTodos(userId: string) {
    logger.info('Get all Todos for user')
    logger.info('Todos of user ' + userId)
    const result = await this.docClient
      .query({
        TableName: this.todoTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false
      })
      .promise()
    const todos = result.Items
    logger.info('Todos: ' + JSON.stringify(todos as TodoItem[]))
    return todos as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    logger.info('Creating todo: ' + todo)
    await this.docClient
      .put({
        TableName: this.todoTable,
        Item: todo
      })
      .promise()
    return todo
  }

  async deleteTodo(todoId: string, userId: string) {
    logger.info('Userid: ', userId)
    logger.info('Deleting todo id: ', todoId)
    try {
      await this.docClient
        .delete({
          TableName: this.todoTable,
          Key: {
            todoId: todoId,
            userId: userId
          }
        })
        .promise()
    } catch (error) {
      logger.error('Could not delete todo: ', error.message)
    }
  }
  async createAttachmentPresignedUrl(todoId: string) {
    logger.info('Getting upload url todoId: ', todoId)
    try {
      return await s3.getSignedUrl('putObject', {
        Bucket: bucket,
        Key: todoId,
        Expires: parseInt(expiration)
      })
    } catch (error) {
      logger.error('Error get signed url: ', error.message)
    }
  }
  async updateTodo(todoId: string, todo: TodoUpdate, userId: string) {
    logger.info('To do id' + todoId)
    logger.info('Updating todo :' + JSON.stringify(todo))
    const getTodo = await this.docClient
      .query({
        TableName: this.todoTable,
        KeyConditionExpression: 'todoId = :todoId AND userId = :userId',
        ExpressionAttributeValues: {
          ':todoId': todoId,
          ':userId': userId
        }
      })
      .promise()

    if (getTodo.Count !== 0) {
      const result = await this.docClient
        .update({
          TableName: this.todoTable,
          Key: {
            todoId: todoId,
            userId: userId
          },
          UpdateExpression:
            'SET #name = :name, dueDate = :dueDate, done = :done',
          ExpressionAttributeNames: {
            '#name': 'name'
          },
          ExpressionAttributeValues: {
            ':name': todo.name,
            ':done': todo.done,
            ':dueDate': todo.dueDate
          }
        })
        .promise()
      const updatedTodo = result.Attributes
      if (updatedTodo != null) {
        logger.info('Updated todo: ', updatedTodo)
        return updatedTodo as TodoItem
      }
    }
    logger.info('Could not update TODO')
    return undefined
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
