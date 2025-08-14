import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
})

interface UploadPart {
  ETag: string
  PartNumber: number
}

export const uploadToS3 = async (file: Blob, key: string, onProgress?: (progress: number) => void): Promise<string> => {
  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!
  const uploadId = await initiateMultipartUpload(bucketName, key)
  
  const chunkSize = 5 * 1024 * 1024 // 5MB chunks
  let partNumber = 1
  const parts: UploadPart[] = []
  let uploadedBytes = 0
  
  for (let start = 0; start < file.size; start += chunkSize) {
    const chunk = file.slice(start, Math.min(start + chunkSize, file.size))
    const part = await uploadPart(bucketName, key, uploadId, partNumber, chunk)
    parts.push(part)
    partNumber++
    
    // Update progress
    uploadedBytes += chunk.size
    if (onProgress) {
      onProgress(Math.round((uploadedBytes / file.size) * 100))
    }
  }
  
  return completeMultipartUpload(bucketName, key, uploadId, parts)
}

const initiateMultipartUpload = async (bucket: string, key: string) => {
  const command = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
  })
  const response = await s3Client.send(command)
  return response.UploadId!
}

const uploadPart = async (
  bucket: string,
  key: string,
  uploadId: string,
  partNumber: number,
  body: Blob
) => {
  const command = new UploadPartCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    Body: body,
  })
  const response = await s3Client.send(command)
  return { ETag: response.ETag!, PartNumber: partNumber }
}

const completeMultipartUpload = async (
  bucket: string,
  key: string,
  uploadId: string,
  parts: UploadPart[]
) => {
  const command = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  })
  const response = await s3Client.send(command)
  return response.Location!
}
