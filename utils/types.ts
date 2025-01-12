export interface UploadResponse {
  file: {
    name: string;
    displayName: string;
    sizeBytes: string;
    createTime: string;
    updateTime: string;
    expirationTime: string;
    sha256Hash: string;
    uri: string;
    state: string;
    mimeType: string;
  };
}
