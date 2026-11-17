import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const accessToken: unknown = request.cookies?.['access_token'];

        if (typeof accessToken !== 'string') {
            throw new UnauthorizedException('Access token is missing');
        }

        let payload: { sub: string };

        try {
            payload = await this.jwtService.verifyAsync<{ sub: string }>(accessToken);
        } catch {
            throw new UnauthorizedException('Invalid or expired access token');
        }

        if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
            throw new UnauthorizedException('Invalid access token');
        }

        const user = await this.prisma.users.findUnique({
            where: { id: payload.sub },
            select: { role: true },
        });

        if (user?.role !== 'admin') {
            throw new ForbiddenException('Admins only');
        }

        return true;
    }
}