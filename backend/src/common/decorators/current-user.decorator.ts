import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

// Extended payload type that includes 'id' alias for 'sub'
type UserPayloadKey = keyof JwtPayload | 'id';

export const CurrentUser = createParamDecorator(
  (data: UserPayloadKey | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) return undefined;

    // 'id' is an alias for 'sub' (the user ID)
    if (data === 'id') {
      return user.sub;
    }

    return data ? user[data as keyof JwtPayload] : user;
  },
);
