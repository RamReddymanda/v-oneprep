import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { CurrentUser, Public, RequestUser } from "../auth-context";
import { LoginDto, SignupDto } from "../dto";
import { AuthService } from "../services/auth.service";

const cookieOptions = {
  httpOnly: true,
  sameSite: "none" as const,
  secure: true,
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7
};

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("signup")
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.signup(dto);
    response.cookie("voneprep_token", session.token, cookieOptions);
    return { user: session.user };
  }

  @Public()
  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.login(dto);
    response.cookie("voneprep_token", session.token, cookieOptions);
    return { user: session.user };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("voneprep_token", { path: "/" });
    return { ok: true };
  }

  @Get("me")
  me(@CurrentUser() user: RequestUser) {
    return this.auth.me(user.id);
  }
}
