import { ref } from 'vue'
import { useTokenStore } from '@/store/token'
import { getSelectedUploadFiles } from './upload-utils'

const UPLOAD_URL = '/common/upload'

type TfileType = 'image' | 'file'
type TImage = 'png' | 'jpg' | 'jpeg' | 'webp' | '*'
type TFile = 'doc' | 'docx' | 'ppt' | 'zip' | 'xls' | 'xlsx' | 'txt' | TImage

interface TOptions<T extends TfileType> {
  formData?: Record<string, any>
  maxSize?: number
  accept?: T extends 'image' ? TImage[] : TFile[]
  fileType?: T
  count?: number
  success?: (params: any) => void | Promise<void>
  error?: (err: any) => void | Promise<void>
  complete?: () => void | Promise<void>
}

export default function useUpload<T extends TfileType>(options: TOptions<T> = {} as TOptions<T>) {
  const {
    formData = {},
    maxSize = 5 * 1024 * 1024,
    accept = ['*'],
    fileType = 'image',
    count = 1,
    success,
    error: onError,
    complete,
  } = options

  const loading = ref(false)
  const error = ref<Error | null>(null)
  const data = ref<any>(null)

  const handleUploadError = (err: any) => {
    const uploadError = err instanceof Error
      ? err
      : new Error(err?.msg || err?.message || err?.errMsg || '上传失败')
    error.value = uploadError
    uni.showToast({
      title: uploadError.message || '上传失败',
      icon: 'none',
    })
    onError?.(uploadError)
  }

  const handleFileChoose = ({
    tempFilePath,
    size,
    name,
    mimeType,
  }: {
    tempFilePath: string
    size: number
    name?: string
    mimeType?: string
  }) => {
    if (size > maxSize) {
      uni.showToast({
        title: `文件大小不能超过 ${maxSize / 1024 / 1024}MB`,
        icon: 'none',
      })
      return
    }

    const nameExtension = name?.split('.').pop()?.toLowerCase()
    const fileExtension = nameExtension || mimeType?.split('/').pop()?.toLowerCase()
    const normalizedExtension = nameExtension ? fileExtension : fileExtension === 'jpeg' ? 'jpg' : fileExtension
    const isTypeValid = accept.some(type => type === '*' || type.toLowerCase() === normalizedExtension)

    if (!isTypeValid) {
      uni.showToast({
        title: `仅支持 ${accept.join('、')} 格式的文件`,
        icon: 'none',
      })
      return
    }

    return uploadFile({
      tempFilePath,
      formData,
      onSuccess: (result) => {
        data.value = result
        return success?.(result)
      },
      onError: handleUploadError,
      onComplete: () => undefined,
    })
  }

  const run = () => {
    if (loading.value)
      return

    // 微信小程序从基础库 2.21.0 开始， wx.chooseImage 停止维护，请使用 uni.chooseMedia 代替。
    // 微信小程序在2023年10月17日之后，使用本API需要配置隐私协议
    const chooseFileOptions = {
      count,
      success: (res: any) => {
        console.log('File selected successfully:', res)
        const selectedFiles = getSelectedUploadFiles(res)
        if (!selectedFiles.length) {
          uni.showToast({ title: '未选择有效文件', icon: 'none' })
          return
        }

        void (async () => {
          loading.value = true
          try {
            for (const selectedFile of selectedFiles) {
              await handleFileChoose(selectedFile)
            }
            await complete?.()
          }
          catch (err) {
            handleUploadError(err)
          }
          finally {
            loading.value = false
          }
        })()
      },
      fail: (err: any) => {
        console.error('File selection failed:', err)
        error.value = err
        onError?.(err)
      },
    }

    if (fileType === 'image') {
      // #ifdef MP-WEIXIN
      uni.chooseMedia({
        ...chooseFileOptions,
        mediaType: ['image'],
      })
      // #endif

      // #ifndef MP-WEIXIN
      uni.chooseImage(chooseFileOptions)
      // #endif
    }
    else {
      uni.chooseFile({
        ...chooseFileOptions,
        type: 'all',
      })
    }
  }

  return { loading, error, data, run }
}

async function uploadFile({
  tempFilePath,
  formData,
  onSuccess,
  onError,
  onComplete,
}: {
  tempFilePath: string
  formData: Record<string, any>
  onSuccess: (data: any) => void | Promise<void>
  onError: (err: any) => void | Promise<void>
  onComplete: () => void
}): Promise<boolean> {
  const tokenStore = useTokenStore()
  const token = tokenStore.updateNowTime().validToken

  if (!token) {
    onError(new Error('登录状态已失效，请重新登录'))
    onComplete()
    return false
  }

  return new Promise((resolve) => {
    const finish = (result: boolean) => {
      onComplete()
      resolve(result)
    }

    uni.uploadFile({
      url: UPLOAD_URL,
      filePath: tempFilePath,
      name: 'file',
      formData,
      header: {
        Authorization: `Bearer ${token}`,
      },
      success: (uploadFileRes) => {
        try {
          let parsedData: any
          try {
            parsedData = typeof uploadFileRes.data === 'string'
              ? JSON.parse(uploadFileRes.data)
              : uploadFileRes.data
          }
          catch {
            throw new Error(`上传失败：服务器响应格式异常（HTTP ${uploadFileRes.statusCode}）`)
          }

          if (uploadFileRes.statusCode < 200 || uploadFileRes.statusCode >= 300) {
            throw new Error(parsedData?.msg || parsedData?.message || `上传失败（HTTP ${uploadFileRes.statusCode}）`)
          }

          if (parsedData?.code !== undefined && parsedData?.code !== 0 && parsedData?.code !== 200) {
            throw new Error(parsedData?.msg || parsedData?.message || '上传失败')
          }

          const result = Object.prototype.hasOwnProperty.call(parsedData, 'data')
            ? parsedData.data
            : parsedData
          Promise.resolve(onSuccess(result))
            .then(() => finish(true))
            .catch(async (err) => {
              await onError(err)
              finish(false)
            })
        }
        catch (err) {
          void Promise.resolve(onError(err)).finally(() => finish(false))
        }
      },
      fail: (err) => {
        console.error('Upload failed:', err)
        void Promise.resolve(onError(err)).finally(() => finish(false))
      },
    })
  })
}
