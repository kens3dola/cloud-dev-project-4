import { FilesAccess } from '../dataLayer/filesAccess'
import { AttachmentUtils } from '../fileStorage/attachmentUtils'
import { File } from '../models/File'
import * as uuid from 'uuid'
import { createLogger } from '../utils/logger'

const logger = createLogger('FilesAccess')
const filesAccess = new FilesAccess()
const attachmentUtils = new AttachmentUtils()

export async function deleteFile(todoId: string, userId: string) {
  return await filesAccess.deleteFile(todoId, userId)
}

export async function createFilePresignedUrl() {
  const url = await attachmentUtils.createFilePresignedUrl()
  return url.split('?')[0]
}

export async function getFilesForUser(userId: string) {
  const result = await filesAccess.getAllFiles(userId)
  logger.info('result: ' + JSON.stringify(result))
  return result
}

export async function createFile(
  userId: string,
  signedUrl: string,
  name: string
) {
  logger.info(`Creating file for user ${userId}`)
  const id = uuid.v4()
  return await filesAccess.createFile({
    fileId: id,
    userId: userId,
    attachmentUrl: signedUrl,
    name: name || id,
    createdAt: new Date().toISOString()
  })
}
