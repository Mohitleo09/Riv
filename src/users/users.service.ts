import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOneByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async findOneById(id: string) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async create(data: { email: string; passwordHash: string }) {
        return this.prisma.user.create({ data });
    }

    async updateRefreshToken(userId: string, refreshToken: string | null) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken } as any,
        });
    }
}
