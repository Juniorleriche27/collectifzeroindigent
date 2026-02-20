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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganisationsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_organisation_dto_1 = require("./dto/create-organisation.dto");
const organisations_service_1 = require("./organisations.service");
let OrganisationsController = class OrganisationsController {
    organisationsService;
    constructor(organisationsService) {
        this.organisationsService = organisationsService;
    }
    async list(request, search) {
        return this.organisationsService.list(request.supabaseAccessToken, search);
    }
    async create(request, payload) {
        return this.organisationsService.create(request.supabaseAccessToken, payload);
    }
};
exports.OrganisationsController = OrganisationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OrganisationsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_organisation_dto_1.CreateOrganisationDto]),
    __metadata("design:returntype", Promise)
], OrganisationsController.prototype, "create", null);
exports.OrganisationsController = OrganisationsController = __decorate([
    (0, common_1.Controller)('organisations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [organisations_service_1.OrganisationsService])
], OrganisationsController);
//# sourceMappingURL=organisations.controller.js.map