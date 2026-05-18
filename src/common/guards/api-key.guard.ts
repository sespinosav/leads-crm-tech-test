import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Optional API-key guard. If the `API_KEY` env var is not set the guard is a
 * no-op, which keeps the local developer experience friendly while still
 * allowing the same code to be locked down in production by setting the env.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('API_KEY');
    if (!expected) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const provided =
      (req.headers['x-api-key'] as string | undefined) ??
      (typeof req.headers.authorization === 'string'
        ? req.headers.authorization.replace(/^Bearer\s+/i, '')
        : undefined);

    if (provided !== expected) {
      throw new UnauthorizedException('Invalid or missing API key');
    }
    return true;
  }
}
