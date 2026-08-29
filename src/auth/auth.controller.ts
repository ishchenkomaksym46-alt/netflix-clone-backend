import {Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Post} from '@nestjs/common';
import { AuthService } from './auth.service';
import {LoginDto, UserDto} from './dto/user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() userDto: UserDto) {
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
      return { status: 200, message: "User added successfully", access_token: signup.access_token };
    }
  }

  @Get('valid')
  async valid(@Body('accessToken') accessToken: string) {
    return this.authService.isValid(accessToken);
  }

  @Get('refresh')
  async refresh(@Body('userId') userId: string) {
    return this.authService.refreshToken(userId);
  }

  @Get('login')
  async login(@Body() loginDto: LoginDto) {
    const login = await this.authService.login(loginDto);

    if(login.status === 200) {
      return { status: 200, access_token: login.accessToken, message: "Login successful" }
    } else if(login.status === 400) {
      throw new NotFoundException(login.error);
    } else if(login.status === 500) {
      throw new InternalServerErrorException(login.error, login.message);
    }
  }

  @Get('logout')
  async logout(@Body('userId') userId: string) {
    const logout = await this.authService.logout(userId);

    if(logout.status === 200) {
      return { status: 200, message: "Logout successful" }
    } else if(logout.status === 400) {
      throw new NotFoundException(logout.error);
    } else if(logout.status === 500) {
      throw new InternalServerErrorException(logout.error, logout.message);
    }
  }

  @Delete('delete-user')
  async deleteUser(@Body('userId') userId: string) {
    const result = await this.authService.deleteUser(userId);

    if(result.status === 400) {
      throw new NotFoundException(result.error);
    } else if (result.status === 500) {
      throw new InternalServerErrorException(result.error, result.message);
    } else if(result.status === 200) {
      return { status: 200, message: "User deleted successfully" };
    }
  }
}
