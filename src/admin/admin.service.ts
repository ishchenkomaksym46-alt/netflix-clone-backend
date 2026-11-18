import { Injectable } from '@nestjs/common';
import {PrismaService} from "../prisma.service";
import {JwtService} from "@nestjs/jwt";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService,
              private readonly jwtService: JwtService) {}

  async check(accessToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(accessToken);
      const id = payload.sub;

      const role = await this.prisma.users.findUnique({
        where: { id },
        select: { role: true },
      })

      console.log(role)

      if (!role || role.role !== 'admin') {
        return { status: 403, error: "Access denied. Admins only." };
      } else {
        return { status: 200, message: "Access granted. Admin privileges confirmed." };
      }
    } catch (e) {
      return { status: 401, error: "Invalid or expired access token", message: e instanceof Error ? e.message : 'Unknown error' };
    }
  }

  async getUsers() {
    try {
      return this.prisma.users.findMany({
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true
        }
      })
    } catch (e) {
      return { status: 401, error: "Error occurred while fetching users", message: e instanceof Error ? e.message : 'Unknown error' };
    }
  }

  async banUser(userId: string) {
    try {
       const user = await this.prisma.users.findUnique({
            where: { id: userId },
       });

       if (!user) {
           return { status: 404, error: "User not found" };
       }

       await this.prisma.users.delete({
            where: { id: userId },
       });

       return { status: 200, message: "User banned successfully" };
    } catch (e) {
      return { status: 401, error: "Error occurred while banning user", message: e instanceof Error ? e.message : 'Unknown error' };
    }
  }

  async addMovie(title: string, director: string, year: number, description: string, ageRating: string) {
    try {
      await this.prisma.content.create({
        data: {
          title,
          director,
          year,
          description,
          ageRating
        }
      });

      return { status: 200, message: "Movie added successfully" };
    } catch (e) {
      return { status: 401, error: "Error occurred while adding movie", message: e instanceof Error ? e.message : 'Unknown error' };
    }
  }
}
