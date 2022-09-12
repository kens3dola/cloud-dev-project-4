import { apiEndpoint } from '../config'
import { File } from '../types/File'
import Axios from 'axios'

export async function getFiles(idToken: string): Promise<File[]> {
  const response = await Axios.get(`${apiEndpoint}/files`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    }
  })
  return response.data.items
}

export async function deleteFile(
  idToken: string,
  fileId: string
): Promise<void> {
  await Axios.delete(`${apiEndpoint}/files/${fileId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    }
  })
}

export async function uploadFile(file: any, idToken: string): Promise<File> {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    }
  }
  const response = await Axios.post(
    `${apiEndpoint}/files?name=${encodeURI(file.name)}`,
    '',
    config
  )
  await Axios.put(response.data.item.attachmentUrl, file)
  return response.data.item as File
}
