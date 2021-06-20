import { Controller, Get, Redirect, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
    @Get('/steam')
    @UseGuards(AuthGuard('steam'))
    @Redirect('/me')
    authenticate(@Req() req: Request): any {
        // @ts-ignore
        req.session.user = req.user;

        return { url: '/me' };
    }
}
