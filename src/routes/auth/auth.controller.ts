import { Controller, Get, Redirect, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { RequireAuthGuard } from './require-auth.guard';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
    @Get('/logout')
    public signoutUser(@Req() req: Request, @Res() res: Response) {
        req.logout();
        res.clearCookie('snapshots.tf', { path: '/' }).redirect(
            process.env.FRONTEND_LOGOUT_URL
        );

        return {};
    }

    @Get('/steam')
    @UseGuards(AuthGuard('steam'))
    @Redirect('/auth/redirect')
    public authenticateUser(@Req() req: Request) {
        // @ts-ignore
        req.session.user = req.user;

        return {
            url: '/auth/redirect',
        };
    }

    @Get('/redirect')
    @UseGuards(RequireAuthGuard)
    @Redirect('/')
    public redirectUser(@Req() req: Request): { url: string } {
        return {
            url: process.env.FRONTEND_RETURN_URL,
        };
    }
}
