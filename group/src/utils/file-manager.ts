import {
    PutObjectCommand,
    S3Client,
    DeleteObjectCommand,
  } from "@aws-sdk/client-s3";
  
  import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
  
  import { v4 as uuid } from "uuid";
  import mime from "mime";
  import { createRequest } from "@aws-sdk/util-create-request";
  import { formatUrl } from "@aws-sdk/util-format-url";
  
  interface FileManagerOptions {
    S3: {
      region: string;
      endpoint: string;
      credentials: {
        accessKeyId: string;
        secretAccessKey: string;
      };
    };
    // in seconds
    urlExpire: number;
    bucket: string;
  }
  
  class FileManager {
    private _client?: S3Client;
    private _config?: FileManagerOptions;
    init(config: FileManagerOptions) {
      this._config = config;
      this._client = new S3Client(config.S3);
    }
  
    get client() {
      if (!this._client) throw new Error("FileManager has not been initiliazed");
      return this._client;
    }
  
    get config() {
      if (!this._config) throw new Error("FileManager has not been initiliazed");
      return this._config;
    }
  
    async generateUploadURL(
      id: string,
      contentType: string
    ): Promise<{ key: string; url: string }> {
      const extention = mime.getExtension(contentType);
      if (!extention) throw new Error(`Invalid content-type:${contentType}`);
  
      const key = `${id}/${uuid()}.${extention}`;
      return await this.generateUploadURLWithKey(key, contentType);
    }
  
    async generateUploadURLWithKey(
      key: string,
      contentType: string
    ): Promise<{ key: string; url: string }> {
      const extention = mime.getExtension(contentType);
      if (!extention) throw new Error(`Invalid content-type:${contentType}`);
  
      const signer = new S3RequestPresigner({ ...this.client.config });
      const request = await createRequest(
        this.client,
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          ACL: "public-read",
          ContentType: contentType,
        })
      );
  
      const signedURL = formatUrl(
        await signer.presign(request, {
          expiresIn: this.config.urlExpire,
        })
      );
      return {
        key: key,
        url: signedURL,
      };
    }
  
    async delete(key: string): Promise<boolean> {
      try {
        const data = await this.client.send(
          new DeleteObjectCommand({ Key: key, Bucket: this.config.bucket })
        );
        console.log(data);
        return data.DeleteMarker ? data.DeleteMarker : false;
      } catch (err) {
        console.log(err);
        return false;
      }
    }
  }
  
  export const fileManager = new FileManager();
  