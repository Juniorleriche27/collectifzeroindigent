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
exports.LocationsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_data_service_1 = require("../infra/supabase-data.service");
let LocationsService = class LocationsService {
    supabaseDataService;
    constructor(supabaseDataService) {
        this.supabaseDataService = supabaseDataService;
    }
    async list(accessToken) {
        const client = this.supabaseDataService.forUser(accessToken);
        const [regionsResult, prefecturesResult, communesResult] = await Promise.all([
            client.from('region').select('id, name').order('name'),
            client.from('prefecture').select('id, name, region_id').order('name'),
            client.from('commune').select('id, name, prefecture_id').order('name'),
        ]);
        if (regionsResult.error) {
            throw regionsResult.error;
        }
        if (prefecturesResult.error) {
            throw prefecturesResult.error;
        }
        if (communesResult.error) {
            throw communesResult.error;
        }
        return {
            communes: communesResult.data ?? [],
            prefectures: prefecturesResult.data ?? [],
            regions: regionsResult.data ?? [],
        };
    }
};
exports.LocationsService = LocationsService;
exports.LocationsService = LocationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_data_service_1.SupabaseDataService])
], LocationsService);
//# sourceMappingURL=locations.service.js.map