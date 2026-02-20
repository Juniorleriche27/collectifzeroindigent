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
exports.SupabaseDataService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseDataService = class SupabaseDataService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    forUser(accessToken) {
        return (0, supabase_js_1.createClient)(this.supabaseUrl, this.supabaseAnonKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        });
    }
    admin() {
        const serviceRoleKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!serviceRoleKey) {
            throw new common_1.InternalServerErrorException('Missing SUPABASE_SERVICE_ROLE_KEY.');
        }
        return (0, supabase_js_1.createClient)(this.supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    get supabaseUrl() {
        const value = this.configService.get('NEXT_PUBLIC_SUPABASE_URL');
        if (!value) {
            throw new common_1.InternalServerErrorException('Missing NEXT_PUBLIC_SUPABASE_URL.');
        }
        return value;
    }
    get supabaseAnonKey() {
        const value = this.configService.get('NEXT_PUBLIC_SUPABASE_ANON_KEY');
        if (!value) {
            throw new common_1.InternalServerErrorException('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.');
        }
        return value;
    }
};
exports.SupabaseDataService = SupabaseDataService;
exports.SupabaseDataService = SupabaseDataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseDataService);
//# sourceMappingURL=supabase-data.service.js.map