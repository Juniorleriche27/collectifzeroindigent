import { SupabaseDataService } from '../infra/supabase-data.service';
export declare class LocationsService {
    private readonly supabaseDataService;
    constructor(supabaseDataService: SupabaseDataService);
    list(accessToken: string): Promise<{
        communes: {
            id: string;
            name: string;
            prefecture_id: string;
        }[];
        prefectures: {
            id: string;
            name: string;
            region_id: string;
        }[];
        regions: {
            id: string;
            name: string;
        }[];
    }>;
}
