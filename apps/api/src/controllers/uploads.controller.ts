import { BadRequestException, Controller, Post, Req, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { UploadsService } from "../services/uploads.service";
import { imageUploadOptions } from "../utils/upload-config";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post("screenshot")
  @UseInterceptors(FileInterceptor("file", imageUploadOptions()))
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException("No file uploaded");
    const origin = `${req.protocol}://${req.get("host")}`;
    return { url: await this.uploads.storeFile(file, origin) };
  }
}
