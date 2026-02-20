import { SupabaseDataService } from '../infra/supabase-data.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
type OrganisationItem = {
    category: string;
    id: string;
    members: number;
    name: string;
};
export declare class OrganisationsService {
    private readonly supabaseDataService;
    constructor(supabaseDataService: SupabaseDataService);
    list(accessToken: string, search?: string): Promise<{
        can_create: boolean;
        items: OrganisationItem[];
        source: string;
        source_note: null;
    } | {
        can_create: boolean;
        items: OrganisationItem[];
        source: string;
        source_note: string;
    }>;
    create(accessToken: string, payload: CreateOrganisationDto): Promise<{
        created_in: string;
        message: string;
    }>;
    private readOrganisationTable;
    private deriveFromMembers;
    private tryInsert;
    private filterBySearch;
    private toOrganisationItem;
    private sortItems;
    private normalizeCategory;
    private text;
    private countValue;
}
export {};
