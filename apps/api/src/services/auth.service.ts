import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Role, User } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { LoginDto, SignupDto } from "../dto";
import { PrismaService } from "./prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException("Email already registered");
    const passwordHash = await hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        passwordHash,
        role: Role.STUDENT
      }
    });
    return this.session(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !user.active) throw new UnauthorizedException("Invalid credentials");
    const ok = await compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    return this.session(user);
  }

  session(user: User) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const options: SignOptions = {
      expiresIn: (this.config.get<string>("JWT_EXPIRES_IN") ?? "7d") as SignOptions["expiresIn"]
    };
    const token = jwt.sign(payload, this.config.get<string>("JWT_SECRET") ?? "dev-secret", {
      ...options
    });
    return { token, user: this.toApiUser(user) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.toApiUser(user);
  }

  toApiUser(user: User) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      joinedAt: user.createdAt.toISOString(),
      active: user.active
    };
  }
}
