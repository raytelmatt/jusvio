export interface R2File {
  id: string;
  name: string;
  size: number;
  downloadUrl: string;
  uploadedAt: string;
}

export interface R2UploadResult {
  file: R2File;
  success: boolean;
  error?: string;
}

export class R2StorageService {
  private bucket: R2Bucket;

  constructor(bucket: R2Bucket) {
    if (!bucket) {
      throw new Error('R2 bucket is not defined. Please check your Cloudflare Workers R2 binding configuration.');
    }
    this.bucket = bucket;
  }

  async uploadFile(
    fileName: string,
    fileContent: ArrayBuffer,
    folderPath: string = 'documents'
  ): Promise<R2UploadResult> {
    try {
      // Create a unique file key with timestamp
      const timestamp = Date.now();
      const sanitizedFolderPath = folderPath.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
      const fileKey = `${sanitizedFolderPath}/${timestamp}-${fileName}`;
      
      // Upload to R2
      const uploadResult = await this.bucket.put(fileKey, fileContent, {
        httpMetadata: {
          contentType: this.getContentType(fileName),
        },
      });

      if (!uploadResult) {
        return {
          file: {} as R2File,
          success: false,
          error: 'Failed to upload file to R2',
        };
      }

      // Generate public URL for the file (served by our app)
      const downloadUrl = `/files/${fileKey}`;

      return {
        file: {
          id: fileKey,
          name: fileName,
          size: fileContent.byteLength,
          downloadUrl: downloadUrl,
          uploadedAt: new Date().toISOString(),
        },
        success: true,
      };
    } catch (error) {
      return {
        file: {} as R2File,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getFile(fileKey: string): Promise<R2Object | null> {
    try {
      return await this.bucket.get(fileKey);
    } catch (error) {
      console.error('Failed to get file from R2:', error);
      return null;
    }
  }

  async deleteFile(fileKey: string): Promise<boolean> {
    try {
      await this.bucket.delete(fileKey);
      return true;
    } catch (error) {
      console.error('Failed to delete file from R2:', error);
      return false;
    }
  }

  async getFileDownloadUrl(fileKey: string): Promise<string> {
    // Return URL that will be served by our app
    return `/files/${fileKey}`;
  }

  async getSignedUrl(fileKey: string, _expiresIn: number = 3600): Promise<string> {
    // For now, just return the regular URL - in production you might implement signed URLs
    return `/files/${fileKey}`;
  }

  private getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  async listFiles(prefix: string = ''): Promise<R2Object[]> {
    try {
      const listing = await this.bucket.list({ prefix });
      return listing.objects;
    } catch (error) {
      console.error('Failed to list files from R2:', error);
      return [];
    }
  }

  async getFileMetadata(fileKey: string): Promise<R2Object | null> {
    try {
      return await this.bucket.head(fileKey);
    } catch (error) {
      console.error('Failed to get file metadata from R2:', error);
      return null;
    }
  }
}
