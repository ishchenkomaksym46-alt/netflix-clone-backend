import {
  Body,
  Controller,
  Delete,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  Post, Req,
  Res
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {LoginDto, UserDto} from './dto/user.dto';
import type { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() userDto: UserDto, @Res({ passthrough: true }) res: Response) {
    const signup = await this.authService.signup(userDto);

    if(!signup){
      throw new InternalServerErrorException("Server did not received an answer");
    }

    if (signup.status === 500) {
      console.log(signup.error);
      throw new InternalServerErrorException(signup.message, signup.error);
    }

    if(signup.status === 400) {
      throw new NotFoundException("User already exists", signup.error);
    }

    if(signup.status === 200){

      if(!signup.access_token || !signup.refresh_token) {
        throw new InternalServerErrorException("Failed to generate access token");
      }

      res.cookie('access_token', signup.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie('refresh_token', signup.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return { status: 200, message: "User added successfully" };
    }

    throw new InternalServerErrorException("Unknown error occurred during signup");
  }

  @Post('valid')
  async valid(@Req() req: Request) {
    const accessToken = req.cookies['access_token'];

    if(!accessToken){
      throw new UnauthorizedException("Access token not found");
    }

    const response = await this.authService.isValid(accessToken);

    if(response.status !== 200) {
      throw new UnauthorizedException(response.error);
    }

    return response;
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];

    if(!refreshToken){
      throw new UnauthorizedException("Refresh token not found");
    }

    const response = await this.authService.refreshToken(refreshToken);

    if(!response){
      throw new InternalServerErrorException("Refresh token not found");
    } else if(response.status === 200){
      res.cookie('access_token', response.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      return { status: 200, message: "Access token refreshed successfully" };
    } else if(response.status !== 200){
      throw new HttpException(response.error || 'Error occurred', response.status);
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const login = await this.authService.login(loginDto);

    if(login.status === 200) {

      if(!login.access_token || !login.refresh_token) {
        throw new InternalServerErrorException("Failed to generate token");
      }

      res.cookie('access_token', login.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie('refresh_token', login.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return { status: 200, message: "Login successful" }
    } else if(login.status === 400) {
      throw new NotFoundException(login.error);
    } else if(login.status === 500) {
      throw new InternalServerErrorException(login.error, login.message);
    }
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return { status: 200, message: "Logout successful" };
  }
}
