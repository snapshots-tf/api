import { Controller, Get, Redirect, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
    @Get('/steam')
    @UseGuards(AuthGuard('steam'))
    @Redirect('/auth/user')
    authenticate(@Req() req: Request): any {
        // @ts-ignore
        req.session.user = req.user;

        return { url: '/auth/user' };
    }

    @Get('/user')
    getUser(@Req() req: Request): any {
        // @ts-ignore
        return req.session.user;
    }
}
