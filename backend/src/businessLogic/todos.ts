import { TodosAccess } from '../dataLayer/todosAcess'
import { AttachmentUtils } from '../fileStorage/attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'
import { createLogger } from '../utils/logger'

// TODO: Implement businessLogic
const logger = createLogger('TodosAccess')
const todosAcess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()
export async function createTodo(
  todo: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const id = uuid.v4()
  return await todosAcess.createTodo({
    todoId: id,
    userId: userId,
    done: false,
    createdAt: new Date().toISOString(),
    ...todo
  })
}

export async function deleteTodo(todoId: string, userId: string) {
  return await todosAcess.deleteTodo(todoId, userId)
}

export async function createAttachmentPresignedUrl(todoId: string) {
  const url = await attachmentUtils.createAttachmentPresignedUrl(todoId)
  return url.split('?')[0]
}

export async function getTodosForUser(userId: string) {
  const result = await todosAcess.getAllTodos(userId)
  logger.info('result: ' + JSON.stringify(result))
  return result
}

export async function updateTodo(
  todoId: string,
  todo: UpdateTodoRequest,
  userId: string
) {
  return await todosAcess.updateTodo(todoId, todo, userId)
}
