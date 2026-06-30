import { SetMetadata, createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Role } from "@prisma/client";

export const IS_PUBLIC = "isPublic";
export const ROLES = "roles";

export const Public = () => SetMetadata(IS_PUBLIC, true);
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

export type RequestUser = {
  id: string;
  email: string;
  role: Role;
};

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestUser => {
  const request = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
  return request.user;
});
