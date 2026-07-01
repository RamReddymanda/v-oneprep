import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { IS_PUBLIC, RequestUser, ROLES } from "../auth-context";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);
    const request = context.switchToHttp().getRequest<{ cookies?: Record<string, string>; user?: RequestUser }>();
    const token = request.cookies?.aeropath_token;

    if (token) {
      try {
        const payload = jwt.verify(token, this.config.get<string>("JWT_SECRET") ?? "dev-secret") as RequestUser;
        request.user = { id: payload.id, email: payload.email, role: payload.role };
      } catch {
        if (!isPublic) throw new UnauthorizedException("Invalid session");
      }
    }

    if (isPublic) return true;
    if (!request.user) throw new UnauthorizedException("Authentication required");

    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES, [context.getHandler(), context.getClass()]);
    return !roles?.length || roles.includes(request.user.role);
  }
}
