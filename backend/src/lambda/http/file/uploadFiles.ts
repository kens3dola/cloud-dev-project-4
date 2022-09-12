import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import {
  createFile,
  createFilePresignedUrl
} from '../../../businessLogic/files'
import { createLogger } from '../../../utils/logger'
import { getUserId } from '../../utils'

const logger = createLogger('fileUrl')
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const fileName = event['queryStringParameters']['name']
    const userId = getUserId(event)
    logger.info(`creating upload url for user: ${userId}`)
    if (!userId) {
      return {
        statusCode: 401,
        body: 'Unauthorized'
      }
    }
    const presignedUrl = await createFilePresignedUrl()
    logger.info(`URL created: ${presignedUrl}`)
    const result = await createFile(userId, presignedUrl, fileName)
    return {
      statusCode: 201,
      body: JSON.stringify({
        item: result
      })
    }
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true
  })
)
