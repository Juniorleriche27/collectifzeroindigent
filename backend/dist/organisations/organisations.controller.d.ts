import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { OrganisationsService } from './organisations.service';
export declare class OrganisationsController {
    private readonly organisationsService;
    constructor(organisationsService: OrganisationsService);
    list(request: AuthenticatedRequest, search?: string): Promise<{
        can_create: boolean;
        items: {
            category: string;
            id: string;
            members: number;
            name: string;
        }[];
        source: string;
        source_note: null;
    } | {
        can_create: boolean;
        items: {
            category: string;
            id: string;
            members: number;
            name: string;
        }[];
        source: string;
        source_note: string;
    }>;
    create(request: AuthenticatedRequest, payload: CreateOrganisationDto): Promise<{
        created_in: string;
        message: string;
    }>;
}
