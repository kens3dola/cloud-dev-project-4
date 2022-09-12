import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { getFilesForUser } from '../../../businessLogic/files'
import { createLogger } from '../../../utils/logger'
import { getUserId } from '../../utils'

const logger = createLogger('File')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = getUserId(event)
    if (!userId) {
      return {
        statusCode: 401,
        body: 'Unauthorized'
      }
    }
    const files = await getFilesForUser(userId)
    return {
      statusCode: 200,
      body: JSON.stringify({ items: files })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
