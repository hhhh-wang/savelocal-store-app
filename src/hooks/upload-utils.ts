export interface SelectedUploadFile {
  tempFilePath: string
  size: number
  name?: string
  mimeType?: string
}

export function getSelectedUploadFiles(res: any): SelectedUploadFile[] {
  const tempFiles = Array.isArray(res?.tempFiles) ? res.tempFiles : []
  const tempFilePaths = Array.isArray(res?.tempFilePaths) ? res.tempFilePaths : []

  return tempFiles.map((file: any, index: number) => ({
    tempFilePath: file?.tempFilePath || file?.path || tempFilePaths[index] || '',
    size: Number(file?.size || 0),
    name: file?.name || '',
    mimeType: file?.type || file?.fileType || '',
  })).filter((file: SelectedUploadFile) => file.tempFilePath)
}
