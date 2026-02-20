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
exports.SupabaseAuthService = void 0;
const common_1 = require("@nestjs/common");
const supabase_data_service_1 = require("../infra/supabase-data.service");
let SupabaseAuthService = class SupabaseAuthService {
    supabaseDataService;
    constructor(supabaseDataService) {
        this.supabaseDataService = supabaseDataService;
    }
    async verifyAccessToken(token) {
        if (!token) {
            throw new common_1.UnauthorizedException('Missing access token.');
        }
        const client = this.supabaseDataService.forUser(token);
        const { data: { user }, error, } = await client.auth.getUser();
        if (error || !user) {
            throw new common_1.UnauthorizedException('Invalid or expired token.');
        }
        const appMetadata = user.app_metadata && typeof user.app_metadata === 'object'
            ? user.app_metadata
            : {};
        const userMetadata = user.user_metadata && typeof user.user_metadata === 'object'
            ? user.user_metadata
            : {};
        const roleFromAppMetadata = typeof appMetadata.role === 'string' ? appMetadata.role : undefined;
        const roleFromUserMetadata = typeof userMetadata.role === 'string' ? userMetadata.role : undefined;
        return {
            email: user.email ?? undefined,
            id: user.id,
            rawUser: user,
            role: roleFromAppMetadata ?? roleFromUserMetadata,
            token,
        };
    }
};
exports.SupabaseAuthService = SupabaseAuthService;
exports.SupabaseAuthService = SupabaseAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_data_service_1.SupabaseDataService])
], SupabaseAuthService);
//# sourceMappingURL=supabase-auth.service.js.map