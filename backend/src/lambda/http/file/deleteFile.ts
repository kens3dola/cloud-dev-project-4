import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { deleteFile } from '../../../businessLogic/files'
import { getUserId } from '../../utils'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('deleteFile')
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const fileId = event.pathParameters.fileId
    // TODO: Remove a TODO item by id
    const userId = getUserId(event)
    logger.info(`Deleting file id: ${fileId} for user id: ${userId}`)
    if (!userId) {
      return {
        statusCode: 401,
        body: 'Unauthorized'
      }
    }
    await deleteFile(fileId, userId)
    logger.info('Deleted')
    return {
      statusCode: 200,
      body: ''
    }
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true
  })
)
