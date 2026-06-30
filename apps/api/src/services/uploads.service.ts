import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {}

  createUploadPlaceholder(filename: string) {
    const bucket = this.config.get<string>("S3_BUCKET");
    const region = this.config.get<string>("S3_REGION");
    if (!bucket || !region) {
      return {
        mode: "LOCAL_PLACEHOLDER",
        url: `https://placehold.co/1200x675?text=${encodeURIComponent(filename || "AeroPath")}`,
        uploadUrl: null
      };
    }
    return {
      mode: "S3_READY",
      url: `https://${bucket}.s3.${region}.amazonaws.com/${filename}`,
      uploadUrl: null
    };
  }
}
