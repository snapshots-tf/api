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
        console.log(req.headers.cookie);

        const parseCookie = (str) =>
            str
                .split(';')
                .map((v) => v.split('='))
                .reduce((acc, v) => {
                    acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(
                        v[1].trim()
                    );
                    return acc;
                }, {});

        return {
            url: `${process.env.FRONTEND_RETURN_URL}?cookie=${
                parseCookie(req.headers.cookie)['snapshots.tf']
            }`,
        };
    }
}
