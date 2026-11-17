import { Injectable } from '@nestjs/common';
import {LoginDto, UserDto} from "./dto/user.dto";
import {PrismaService} from "../prisma.service";
import * as bcrypt from "bcrypt";
import {JwtService, JwtSignOptions} from "@nestjs/jwt";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService,
                private readonly jwtService: JwtService,
                private readonly configService: ConfigService) {
    }

    async refreshToken(refreshToken: string) {
        const refresh_secret = this.configService.get<string>('JWT_REFRESH_SECRET');

        if(!refreshToken) {
            return { status: 400, error: "Invalid refresh token" };
        } else if (!refresh_secret) {
            return { status: 500, error: "Refresh secret not configured" };
        }

        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, { secret: refresh_secret });

            const access_token = await this.jwtService.signAsync({ sub: payload.sub, username: payload.username, role: payload.role }, {
                secret: this.configService.get<string>('JWT_SECRET'),
                expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') as JwtSignOptions['expiresIn'],
            });

            return { status: 200, access_token };
        } catch (e: any) {
            return { status: 401, error: "Invalid or expired refresh token", message: e.message };
        }
    }

    async signup(userDto: UserDto) {
        const password = userDto.password;
        const username = userDto.username;
        const email = userDto.email;

        try {
            const existingUser = await this.prisma.users.findUnique({
                where: {
                    email: email,
                },
            });

            if (existingUser) {
                return { message: 'User already exists', error: 'User with this email already exists', status: 400 };
            }

            const hash = await bcrypt.hash(password, 8);

            const user = await this.prisma.users.create({
                data: {
                    username,
                    email,
                    password: hash,
                },
                select: {
                    id: true,
                    role: true,
                }
            });

            const payload = {
                sub: user.id,
                username: username,
                role: user.role,
            }

            const secret = this.configService.get<string>('JWT_SECRET');
            const secret_expires_in = this.configService.get<string>('JWT_EXPIRES_IN');
            const refresh_secret = this.configService.get<string>('JWT_REFRESH_SECRET');
            const refresh_expires_in = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN');

            if(!secret || !refresh_secret || !secret_expires_in || !refresh_expires_in) {
                return { message: 'JWT secret not configured', error: 'Missing JWT secret in configuration', status: 500 };
            }

            const token = await this.jwtService.signAsync(payload, { secret: secret,
                expiresIn: secret_expires_in as JwtSignOptions['expiresIn'] });

            const refresh_token = await this.jwtService.signAsync(payload, { secret: refresh_secret,
                expiresIn: refresh_expires_in as JwtSignOptions['expiresIn'] });

            return { status: 200, user, access_token: token, refresh_token };
        } catch (e: any) {
            console.error(e);

            return { message: 'Error occurred during signup', error: e.message, status: 500 };
        }
    }

    async isValid(accessToken: string) {
        try {
            await this.jwtService.verifyAsync(accessToken, { secret: this.configService.get<string>('JWT_SECRET') });

            return { status: 200, message: 'Access token is valid' };
        } catch (e: any) {
            return { status: 400, error: 'Invalid access token', message: e.message };
        }
    }

    async login(login: LoginDto) {
        const { email, password } = login;

        if(!email || !password) {
            return { status: 400, error: "Email or password are required" };
        }

        try {
            const user = await this.prisma.users.findUnique({
                where: {
                    email
                },
                select: {
                    password: true,
                    id: true,
                    role: true,
                    username: true
                }
            });

            if (!user) {
                return { status: 400, error: "Invalid credentials" };
            }

            const isPasswordValid = bcrypt.compareSync(password, user.password);

            if (!isPasswordValid) {
                return { status: 400, error: "Invalid credentials" };
            }

            const refresh_secret = this.configService.get<string>('JWT_REFRESH_SECRET');
            const refresh_expires_in = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN');

            const secret = this.configService.get<string>('JWT_SECRET');
            const secret_expires_in = this.configService.get<string>('JWT_EXPIRES_IN');

            if(!refresh_expires_in || !refresh_secret) {
                return { status: 500, error: "JWT refresh token not configured", message: "Missing JWT refresh token in configuration" };
            }

            const payload = {
                sub: user.id,
                username: user.username,
                role: user.role,
            }

            const refresh_token = await this.jwtService.signAsync(payload, {
                secret: refresh_secret,
                expiresIn: refresh_expires_in as JwtSignOptions['expiresIn']});

            const access_token = await this.jwtService.signAsync(payload, {
                secret: secret,
                expiresIn: secret_expires_in as JwtSignOptions['expiresIn']});

            return { status: 200, access_token, refresh_token }
        } catch (e: any) {
            return { status: 500, error: "Error occurred during login", message: e.message };
        }
    }

    async logout(accessToken: string) {
        if (!accessToken) {
            return { status: 400, error: "Invalid access token" };
        }

        try {
            const payload = await this.jwtService.verifyAsync<{ sub: string }>(
                accessToken,
                { secret: this.configService.get<string>('JWT_SECRET') },
            );

            if(!payload.sub) {
                return { status: 400, error: "Invalid access token" };
            }

            return { status: 200, message: 'Logged out' };
        } catch (e: any) {
            return { status: 500, error: "Error occurred during logout", message: e.message };
        }
    }

    async deleteUser(userId: string) {
        if (!userId) {
            return { status: 400, error: "Invalid user id" };
        }

        try {
            await this.prisma.users.delete({
                where: {
                    id: userId
                }
            });

            return { status: 200, message: 'User deleted' };
        } catch (e: any) {
            return { status: 500, error: "Error occurred during user deletion", message: e.message };
        }
    }
}
