import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const bucketName = "telisik-bucket";

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.REACT_APP_S3_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.REACT_APP_S3_ACCESS_ID || "",
    secretAccessKey: process.env.REACT_APP_S3_SECRET_ID || "",
  },
});

export const S3Upload = async (file: any, fileName?: string) => {
  try {
    const res = await S3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Body: file,
        Key: fileName || file?.name,
        ContentType: `image/${file?.name.split(".").pop()}`,
      })
    );
    if (res) {
      return file.name;
    }
  } catch (err) {
    console.log("Storage err: ", err);
    return null;
  }
};

export const ApiGetFileById = async (fileId: string) => {
  try {
    const res = await S3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: fileId,
      })
    );
    console.log(res);
  } catch (err) {
    console.log("Storage err: ", err);
  }
};

export const ApiGetFileUrlById = (fileId: string) => {
  return `https://pub-007d430c70f245248a9ac93600ab2b1a.r2.dev/${fileId}`;
};
