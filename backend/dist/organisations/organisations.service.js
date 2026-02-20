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
exports.OrganisationsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_data_service_1 = require("../infra/supabase-data.service");
let OrganisationsService = class OrganisationsService {
    supabaseDataService;
    constructor(supabaseDataService) {
        this.supabaseDataService = supabaseDataService;
    }
    async list(accessToken, search) {
        const client = this.supabaseDataService.forUser(accessToken);
        const organisationTable = await this.readOrganisationTable(client, 'organisation');
        if (organisationTable) {
            return this.filterBySearch({
                can_create: true,
                items: organisationTable,
                source: 'public.organisation',
                source_note: null,
            }, search);
        }
        const organizationTable = await this.readOrganisationTable(client, 'organization');
        if (organizationTable) {
            return this.filterBySearch({
                can_create: true,
                items: organizationTable,
                source: 'public.organization',
                source_note: null,
            }, search);
        }
        const fromMembers = await this.deriveFromMembers(client);
        return this.filterBySearch({
            can_create: false,
            items: fromMembers,
            source: 'public.member',
            source_note: 'Aucune table organisation detectee.',
        }, search);
    }
    async create(accessToken, payload) {
        const client = this.supabaseDataService.forUser(accessToken);
        const normalizedName = payload.name.trim();
        if (!normalizedName) {
            throw new common_1.BadRequestException('Organisation name is required.');
        }
        const payloads = [
            { category: payload.type, name: normalizedName },
            { name: normalizedName, type: payload.type },
            { org_name: normalizedName, profile_type: payload.type },
            { title: normalizedName, type: payload.type },
            { name: normalizedName },
        ];
        const firstTry = await this.tryInsert(client, 'organisation', payloads);
        if (firstTry.ok)
            return {
                created_in: 'public.organisation',
                message: 'Organisation created.',
            };
        if (firstTry.error && !firstTry.tableMissing)
            throw new common_1.BadRequestException(firstTry.error);
        const secondTry = await this.tryInsert(client, 'organization', payloads);
        if (secondTry.ok)
            return {
                created_in: 'public.organization',
                message: 'Organisation created.',
            };
        if (secondTry.error && !secondTry.tableMissing)
            throw new common_1.BadRequestException(secondTry.error);
        throw new common_1.BadRequestException('Aucune table organisation/organization detectee. Creation impossible pour le moment.');
    }
    async readOrganisationTable(client, tableName) {
        const { data, error } = await client.from(tableName).select('*').limit(200);
        if (error) {
            if (error.code === '42P01' || error.code === 'PGRST205') {
                return null;
            }
            throw error;
        }
        const items = (data ?? [])
            .map((row, index) => this.toOrganisationItem(row, index))
            .filter((item) => Boolean(item));
        return this.sortItems(items);
    }
    async deriveFromMembers(client) {
        const { data, error } = await client
            .from('member')
            .select('id, join_mode, org_name, association_name, enterprise_name');
        if (error) {
            throw error;
        }
        const grouped = new Map();
        for (const row of (data ?? [])) {
            const joinMode = this.text(row.join_mode).toLowerCase();
            const associationName = this.text(row.association_name);
            const enterpriseName = this.text(row.enterprise_name);
            const orgName = this.text(row.org_name);
            const name = associationName || enterpriseName || orgName;
            if (!name || joinMode === 'personal')
                continue;
            const key = name.toLowerCase();
            const category = associationName || joinMode === 'association'
                ? 'Association'
                : enterpriseName || joinMode === 'enterprise'
                    ? 'Entreprise'
                    : 'Organisation';
            const existing = grouped.get(key);
            if (existing) {
                existing.members += 1;
            }
            else {
                grouped.set(key, {
                    category,
                    id: this.text(row.id) || `${key.replaceAll(' ', '-')}-0`,
                    members: 1,
                    name,
                });
            }
        }
        return this.sortItems(Array.from(grouped.values()));
    }
    async tryInsert(client, tableName, payloads) {
        let schemaError = null;
        for (const payload of payloads) {
            const { error } = await client.from(tableName).insert(payload);
            if (!error)
                return { error: null, ok: true, tableMissing: false };
            if (error.code === '42P01' || error.code === 'PGRST205') {
                return { error: null, ok: false, tableMissing: true };
            }
            if (error.code === '42703' || error.code === '23502') {
                schemaError = error.message;
                continue;
            }
            return { error: error.message, ok: false, tableMissing: false };
        }
        return {
            error: schemaError
                ? `Schema organisation incompatible pour insertion MVP: ${schemaError}`
                : 'Insertion impossible.',
            ok: false,
            tableMissing: false,
        };
    }
    filterBySearch(data, search) {
        const normalizedSearch = this.text(search).toLowerCase();
        if (!normalizedSearch)
            return data;
        return {
            ...data,
            items: data.items.filter((item) => `${item.name} ${item.category}`
                .toLowerCase()
                .includes(normalizedSearch)),
        };
    }
    toOrganisationItem(row, index) {
        const name = this.text(row.name) ||
            this.text(row.org_name) ||
            this.text(row.organization_name) ||
            this.text(row.organisation_name) ||
            this.text(row.title) ||
            this.text(row.label);
        if (!name)
            return null;
        const categoryRaw = this.text(row.type) ||
            this.text(row.category) ||
            this.text(row.profile_type) ||
            'organisation';
        const members = this.countValue(row.member_count) ||
            this.countValue(row.members_count) ||
            this.countValue(row.members) ||
            this.countValue(row.total_members);
        return {
            category: this.normalizeCategory(categoryRaw.toLowerCase()),
            id: this.text(row.id) ||
                this.text(row.uuid) ||
                `${name.toLowerCase().replaceAll(' ', '-')}-${index}`,
            members,
            name,
        };
    }
    sortItems(items) {
        return items.sort((first, second) => {
            if (second.members !== first.members)
                return second.members - first.members;
            return first.name.localeCompare(second.name, 'fr');
        });
    }
    normalizeCategory(value) {
        if (value === 'association')
            return 'Association';
        if (value === 'enterprise')
            return 'Entreprise';
        if (value === 'personal')
            return 'Personnel';
        return value ? value[0].toUpperCase() + value.slice(1) : 'Organisation';
    }
    text(value) {
        return typeof value === 'string' ? value.trim() : '';
    }
    countValue(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue) || numericValue < 0)
            return 0;
        return Math.floor(numericValue);
    }
};
exports.OrganisationsService = OrganisationsService;
exports.OrganisationsService = OrganisationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_data_service_1.SupabaseDataService])
], OrganisationsService);
//# sourceMappingURL=organisations.service.js.map