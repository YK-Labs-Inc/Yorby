import * as tus from "tus-js-client";

export const uploadFile = async ({
  bucketName,
  filePath,
  file,
  setProgress,
  onComplete,
  accessToken,
  logError,
  logInfo,
}: {
  bucketName: string;
  filePath: string;
  file: File;
  setProgress: (progress: number) => void;
  onComplete: () => void;
  accessToken: string;
  logError: (message: string, data: any) => void;
  logInfo: (message: string, data: any) => void;
}) => {
  var upload = new tus.Upload(file, {
    endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
    retryDelays: [0, 3000, 5000, 10000, 20000],
    headers: {
      authorization: `Bearer ${accessToken}`,
      "x-upsert": "true", // optionally set upsert to true to overwrite existing files
    },
    uploadDataDuringCreation: true,
    removeFingerprintOnSuccess: true, // Important if you want to allow re-uploading the same file https://github.com/tus/tus-js-client/blob/main/docs/api.md#removefingerprintonsuccess
    metadata: {
      bucketName: bucketName,
      objectName: filePath,
      contentType: file.type,
      cacheControl: "3600",
    },
    chunkSize: 6 * 1024 * 1024, // NOTE: it must be set to 6MB (for now) do not change it
    onError: function (error) {
      logError("Error uploading file", {
        error,
        function: "uploadFile",
      });
    },
    onProgress: function (bytesUploaded, bytesTotal) {
      var percentage = Math.round((bytesUploaded / bytesTotal) * 100);
      if (percentage === 100) {
        setProgress(99);
      } else {
        setProgress(percentage);
      }
    },
    onSuccess: function () {
      logInfo("File uploaded successfully", {
        filePath,
        url: upload.url,
      });
      setProgress(100);
      onComplete();
    },
  });

  // Check if there are any previous uploads to continue.
  return upload.findPreviousUploads().then(function (previousUploads) {
    // Found previous uploads so we select the first one.
    if (previousUploads.length) {
      upload.resumeFromPreviousUpload(previousUploads[0]);
    }

    // Start the upload
    upload.start();
  });
};
