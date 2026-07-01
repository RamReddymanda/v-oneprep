import fs from "node:fs";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

@Injectable()
export class UploadsService {
  private s3: S3Client | null = null;
  private bucket = process.env.S3_BUCKET ?? "";
  private publicBase = process.env.S3_PUBLIC_URL ?? "";

  constructor() {
    if (this.bucket && process.env.S3_ACCESS_KEY_ID) {
      this.s3 = new S3Client({
        region: process.env.S3_REGION ?? "auto",
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? ""
        }
      });
    }
  }

  async storeFile(file: Express.Multer.File, origin: string): Promise<string> {
    if (this.s3 && this.bucket) {
      try {
        const key = `uploads/${file.filename}`;
        await this.s3.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: fs.readFileSync(file.path),
            ContentType: file.mimetype
          })
        );
        fs.unlink(file.path, () => {});
        const base = this.publicBase || `${process.env.S3_ENDPOINT}/${this.bucket}`;
        return `${base}/${key}`;
      } catch (err) {
        fs.unlink(file.path, () => {});
        throw new InternalServerErrorException("File upload to storage failed");
      }
    }
    return this.publicUrlFor(file.filename, origin);
  }

  publicUrlFor(filename: string, origin: string) {
    return `${origin}/uploads/${filename}`;
  }
}
