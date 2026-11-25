import { Request, Response } from "express";
import Joi from "joi";
import { USER_LIMITS } from "../../../constant/auth";
import { HttpStatus } from "../../../constant/http";
import { AuthServiceInterface } from "../../../service/auth";
import { toUserDto } from "../../dto/user";
import { currentUser } from "../../middleware/authenticate";
import { Controller } from "../controller";

export interface AuthControllerInterface {
    login(req: Request, res: Response): Promise<any>;
    me(req: Request, res: Response): Promise<any>;
}

const loginSchema = Joi.object({
    email: Joi.string().trim().max(USER_LIMITS.EMAIL_MAX).email({ tlds: false }).required(),
    // Not trimmed: spaces can be part of a password
    password: Joi.string().max(USER_LIMITS.PASSWORD_MAX).required(),
});

export class AuthController extends Controller implements AuthControllerInterface {
    constructor(private authService: AuthServiceInterface) {
        super();
        this.login = this.login.bind(this);
        this.me = this.me.bind(this);
    }

    async login(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(loginSchema, req.body);
        const { token, user } = await this.authService.login(value.email, value.password);
        return this.sendResponse({ response: { token, user: toUserDto(user) } }, HttpStatus.OK, res);
    }

    async me(_req: Request, res: Response): Promise<any> {
        return this.sendResponse({ response: toUserDto(currentUser(res)) }, HttpStatus.OK, res);
    }
}

export const newAuthV1Controller = async (authService: AuthServiceInterface): Promise<AuthController> => {
    return new AuthController(authService);
};
