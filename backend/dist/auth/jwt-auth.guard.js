"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const supabase_auth_service_1 = require("./supabase-auth.service");
let JwtAuthGuard = class JwtAuthGuard {
    supabaseAuthService;
    constructor(supabaseAuthService) {
        this.supabaseAuthService = supabaseAuthService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const accessToken = this.extractBearerToken(request.headers.authorization);
        request.supabaseAccessToken = accessToken;
        request.user =
            await this.supabaseAuthService.verifyAccessToken(accessToken);
        return true;
    }
    extractBearerToken(authorizationHeader) {
        if (!authorizationHeader?.toLowerCase().startsWith('bearer ')) {
            throw new common_1.UnauthorizedException('Authorization Bearer token is required.');
        }
        const token = authorizationHeader.slice('bearer '.length).trim();
        if (!token) {
            throw new common_1.UnauthorizedException('Bearer token is empty.');
        }
        return token;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_auth_service_1.SupabaseAuthService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map