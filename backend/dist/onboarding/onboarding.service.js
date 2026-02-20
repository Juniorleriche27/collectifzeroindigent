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
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
const supabase_data_service_1 = require("../infra/supabase-data.service");
let OnboardingService = class OnboardingService {
    supabaseDataService;
    constructor(supabaseDataService) {
        this.supabaseDataService = supabaseDataService;
    }
    async create(accessToken, payload) {
        const client = this.supabaseDataService.forUser(accessToken);
        const { data: { user }, error: userError, } = await client.auth.getUser();
        if (userError || !user) {
            throw new common_1.UnauthorizedException('Invalid authenticated session.');
        }
        if (payload.join_mode !== 'personal' && !payload.org_name) {
            throw new common_1.BadRequestException('org_name is required for association/enterprise.');
        }
        const { data: existingMember, error: existingMemberError } = await client
            .from('member')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
        if (existingMemberError) {
            throw existingMemberError;
        }
        if (existingMember) {
            return {
                member_id: existingMember.id,
                message: 'Member already exists.',
            };
        }
        const { data: member, error: createMemberError } = await client
            .from('member')
            .insert({
            commune_id: payload.commune_id,
            email: payload.email || null,
            first_name: payload.first_name,
            join_mode: payload.join_mode,
            last_name: payload.last_name,
            org_name: payload.join_mode === 'personal' ? null : (payload.org_name ?? null),
            phone: payload.phone,
            prefecture_id: payload.prefecture_id,
            region_id: payload.region_id,
            user_id: user.id,
        })
            .select('id')
            .single();
        if (createMemberError || !member) {
            throw (createMemberError ?? new common_1.BadRequestException('Unable to create member.'));
        }
        const { error: updateProfileError } = await client
            .from('profile')
            .update({ member_id: member.id })
            .eq('user_id', user.id);
        if (updateProfileError) {
            throw updateProfileError;
        }
        return {
            member_id: member.id,
            message: 'Onboarding completed.',
        };
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_data_service_1.SupabaseDataService])
], OnboardingService);
//# sourceMappingURL=onboarding.service.js.map