import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    InternalServerErrorException, Post,
    Req,
    UnauthorizedException, UseGuards
} from "@nestjs/common";
import {AdminService} from "./admin.service";
import type { Request } from 'express';
import {RolesGuard} from "./guards/admin.guard";

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('check')
    async check(@Req() req: Request) {
       const accessToken = req.cookies['access_token'];

        if (!accessToken) {
          throw new UnauthorizedException('Access token is missing');
        }

        const response = await this.adminService.check(accessToken);

        if(!response) {
          throw new InternalServerErrorException('An error occurred while checking admin privileges');
        } else if (response.status !== 200) {
          throw new UnauthorizedException(response.error);
        } else {
          return { status: HttpStatus.OK, message: response.message}
        }
    }

  @Get('users')
  @UseGuards(RolesGuard)
  async getUsers() {
    const response = await this.adminService.getUsers();

    if(!response) {
        throw new InternalServerErrorException('An error occurred while fetching users');
    }

    return { status: HttpStatus.OK, users: response };
  }

  @Delete('ban')
  @UseGuards(RolesGuard)
  async banUser(@Body() body: { userId: string }) {
    const { userId } = body;

    try {
        const response = await this.adminService.banUser(userId);

        if(!response) {
            throw new InternalServerErrorException('An error occurred while banning the user');
        }

        return { status: HttpStatus.OK, message: response.message };
    } catch (e) {
        throw new InternalServerErrorException('An error occurred while banning the user');
    }
  }

  @Post('add-movie')
  @UseGuards(RolesGuard)
  async addMovie(@Body() body: { title: string, director: string, year: number, description?: string, ageRating: string }) {
    const { title, director, year, ageRating } = body;
    let { description } = body;

    if(!description) {
        description = "No description provided.";
    }

    try {
        const response = await this.adminService.addMovie(title, director, year, description, ageRating);

        if(!response) {
            throw new InternalServerErrorException('An error occurred while adding the movie');
        }

        return { status: HttpStatus.OK, message: response.message };
    } catch (e) {
        throw new InternalServerErrorException('An error occurred while adding the movie');
    }
  }
}