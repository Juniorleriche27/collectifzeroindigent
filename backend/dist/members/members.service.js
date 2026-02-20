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
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_data_service_1 = require("../infra/supabase-data.service");
let MembersService = class MembersService {
    supabaseDataService;
    constructor(supabaseDataService) {
        this.supabaseDataService = supabaseDataService;
    }
    async list(accessToken, query) {
        const client = this.supabaseDataService.forUser(accessToken);
        const page = this.positiveInt(query.page, 1);
        const pageSize = this.positiveInt(query.page_size, 10, 50);
        const rangeFrom = (page - 1) * pageSize;
        const rangeTo = rangeFrom + pageSize - 1;
        let dbQuery = client
            .from('member')
            .select('id, user_id, first_name, last_name, phone, email, status, region_id, prefecture_id, commune_id, join_mode, org_name, created_at', { count: 'exact' })
            .range(rangeFrom, rangeTo);
        const sort = query.sort ?? 'created_desc';
        if (sort === 'name_asc') {
            dbQuery = dbQuery
                .order('last_name', { ascending: true })
                .order('first_name', { ascending: true });
        }
        else if (sort === 'name_desc') {
            dbQuery = dbQuery
                .order('last_name', { ascending: false })
                .order('first_name', { ascending: false });
        }
        else if (sort === 'created_asc') {
            dbQuery = dbQuery.order('created_at', { ascending: true });
        }
        else if (sort === 'status_asc') {
            dbQuery = dbQuery
                .order('status', { ascending: true })
                .order('created_at', { ascending: false });
        }
        else {
            dbQuery = dbQuery.order('created_at', { ascending: false });
        }
        if (query.status)
            dbQuery = dbQuery.eq('status', query.status);
        if (query.region_id)
            dbQuery = dbQuery.eq('region_id', query.region_id);
        if (query.prefecture_id)
            dbQuery = dbQuery.eq('prefecture_id', query.prefecture_id);
        if (query.commune_id)
            dbQuery = dbQuery.eq('commune_id', query.commune_id);
        if (query.q) {
            const safeSearch = query.q.replaceAll(',', ' ').trim();
            if (safeSearch) {
                dbQuery = dbQuery.or(`first_name.ilike.%${safeSearch}%,last_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`);
            }
        }
        const { data, error, count } = await dbQuery;
        if (error) {
            throw error;
        }
        return {
            count: count ?? 0,
            page,
            pageSize,
            rows: data ?? [],
        };
    }
    async getById(accessToken, memberId) {
        const client = this.supabaseDataService.forUser(accessToken);
        const { data, error } = await client
            .from('member')
            .select('id, user_id, first_name, last_name, phone, email, status, region_id, prefecture_id, commune_id, join_mode, org_name, created_at')
            .eq('id', memberId)
            .maybeSingle();
        if (error) {
            throw error;
        }
        return data;
    }
    async getCurrent(accessToken) {
        const client = this.supabaseDataService.forUser(accessToken);
        const userId = await this.getCurrentUserId(accessToken);
        const { data, error } = await client
            .from('member')
            .select('id, user_id, first_name, last_name, phone, email, status, region_id, prefecture_id, commune_id, join_mode, org_name, created_at')
            .eq('user_id', userId)
            .maybeSingle();
        if (error) {
            throw error;
        }
        return data;
    }
    async update(accessToken, memberId, payload) {
        const client = this.supabaseDataService.forUser(accessToken);
        const normalizedPayload = {
            ...payload,
            email: payload.email || null,
            org_name: payload.join_mode && payload.join_mode === 'personal'
                ? null
                : (payload.org_name ?? null),
        };
        const { data, error } = await client
            .from('member')
            .update(normalizedPayload)
            .eq('id', memberId)
            .select('id, user_id, first_name, last_name, phone, email, status, region_id, prefecture_id, commune_id, join_mode, org_name, created_at')
            .maybeSingle();
        if (error) {
            throw error;
        }
        return data;
    }
    async updateCurrent(accessToken, payload) {
        const client = this.supabaseDataService.forUser(accessToken);
        const userId = await this.getCurrentUserId(accessToken);
        const normalizedPayload = {
            ...payload,
            email: payload.email || null,
            org_name: payload.join_mode && payload.join_mode === 'personal'
                ? null
                : (payload.org_name ?? null),
        };
        const { data, error } = await client
            .from('member')
            .update(normalizedPayload)
            .eq('user_id', userId)
            .select('id, user_id, first_name, last_name, phone, email, status, region_id, prefecture_id, commune_id, join_mode, org_name, created_at')
            .maybeSingle();
        if (error) {
            throw error;
        }
        return data;
    }
    positiveInt(value, fallback, max = 1000) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 1)
            return fallback;
        return Math.min(Math.floor(parsed), max);
    }
    async getCurrentUserId(accessToken) {
        const client = this.supabaseDataService.forUser(accessToken);
        const { data: { user }, error, } = await client.auth.getUser();
        if (error || !user) {
            throw new common_1.UnauthorizedException('Invalid authenticated session.');
        }
        return user.id;
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_data_service_1.SupabaseDataService])
], MembersService);
//# sourceMappingURL=members.service.js.map