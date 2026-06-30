import { Body, Controller, Post } from "@nestjs/common";
import { Role } from "@prisma/client";
import { Roles } from "../auth-context";
import { UploadsService } from "../services/uploads.service";

@Roles(Role.ADMIN)
@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post("prepare")
  prepare(@Body() dto: { filename: string }) {
    return this.uploads.createUploadPlaceholder(dto.filename);
  }
}
