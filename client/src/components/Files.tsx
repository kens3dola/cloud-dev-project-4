import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Form
} from 'semantic-ui-react'

import { deleteFile, getFiles, uploadFile } from '../api/files-api'
import Auth from '../auth/Auth'
import { File } from '../types/File'

enum UploadState {
  NoUpload,
  FetchingPresignedUrl,
  UploadingFile
}

interface FilesProps {
  auth: Auth
  history: History
}

interface FilesState {
  files: File[]
  newFileName: string
  loadingFiles: boolean
  file: any
  uploadState: UploadState
  deletingFiles: boolean
}

export class Files extends React.PureComponent<FilesProps, FilesState> {
  state: FilesState = {
    files: [],
    newFileName: '',
    loadingFiles: true,
    file: undefined,
    uploadState: UploadState.NoUpload,
    deletingFiles: false
  }

  onFileDelete = async (fileId: string) => {
    try {
      this.setState({ deletingFiles: true })
      await deleteFile(this.props.auth.getIdToken(), fileId)
      this.setState({
        files: this.state.files.filter((file) => file.fileId !== fileId),
        deletingFiles: false
      })
    } catch {
      alert('File deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const files = await getFiles(this.props.auth.getIdToken())
      this.setState({
        files,
        loadingFiles: false
      })
    } catch (e) {
      alert(`Failed to fetch files: ${(e as Error).message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">Albums</Header>
        {this.renderUploadForm()}
        {/* {this.isDeleting()} */}
        {this.renderFiles()}
      </div>
    )
  }

  //   isDeleting() {
  //     if (this.state.deletingFiles) {
  //       return (
  //         <Grid.Row>
  //           <Loader indeterminate active inline="centered">
  //             Deleting Image
  //           </Loader>
  //         </Grid.Row>
  //       )
  //     }
  //   }

  renderFiles() {
    if (this.state.loadingFiles) {
      return this.renderLoading()
    }
    return this.renderFilesList()
  }

  renderFilesList() {
    return (
      <Grid padded container centered>
        {this.state.files.map((file, pos) => {
          return (
            <Grid key={file.fileId} centered>
              <Grid.Row>
                {file.attachmentUrl && (
                  <Image src={file.attachmentUrl} size="big" wrapped bordered />
                )}
              </Grid.Row>
              {file.name}
              <Grid.Row>
                <Button
                  icon
                  color="red"
                  onClick={() => this.onFileDelete(file.fileId)}
                  size="mini"
                  loading={this.state.deletingFiles}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Row>
              <Divider />
            </Grid>
          )
        })}
      </Grid>
    )
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading Images
        </Loader>
      </Grid.Row>
    )
  }

  renderUploadForm() {
    return (
      <div>
        <Form onSubmit={this.handleSubmit}>
          <Form.Field>
            <label>File</label>
            <input
              type="file"
              accept="image/*"
              placeholder="Image to upload"
              onChange={this.handleFileChange}
            />
          </Form.Field>

          {this.renderButton()}
        </Form>
      </div>
    )
  }

  renderButton() {
    return (
      <div>
        {this.state.uploadState === UploadState.FetchingPresignedUrl && (
          <p>Uploading image metadata</p>
        )}
        {this.state.uploadState === UploadState.UploadingFile && (
          <p>Uploading image</p>
        )}
        <Button
          loading={this.state.uploadState !== UploadState.NoUpload}
          type="submit"
        >
          Upload image
        </Button>
      </div>
    )
  }

  handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      if (!this.state.file) {
        alert('File should be selected')
        return
      }

      this.setUploadState(UploadState.UploadingFile)
      const file: File = await uploadFile(
        this.state.file,
        this.props.auth.getIdToken()
      )
      this.state.files.push(file)
      alert('Image was uploaded!')
    } catch (e) {
      alert('Could not upload a file: ' + (e as Error).message)
    } finally {
      this.setUploadState(UploadState.NoUpload)
    }
  }

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    this.setState({
      file: files[0]
    })
  }

  setUploadState(uploadState: UploadState) {
    this.setState({
      uploadState
    })
  }
}
