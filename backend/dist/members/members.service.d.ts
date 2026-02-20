import { SupabaseDataService } from '../infra/supabase-data.service';
import { UpdateMemberDto } from './dto/update-member.dto';
type ListMembersQuery = {
    commune_id?: string;
    page?: string;
    page_size?: string;
    prefecture_id?: string;
    q?: string;
    region_id?: string;
    sort?: string;
    status?: string;
};
export declare class MembersService {
    private readonly supabaseDataService;
    constructor(supabaseDataService: SupabaseDataService);
    list(accessToken: string, query: ListMembersQuery): Promise<{
        count: number;
        page: number;
        pageSize: number;
        rows: {
            id: string;
            user_id: string;
            first_name: string | null;
            last_name: string | null;
            phone: string | null;
            email: string | null;
            status: string | null;
            region_id: string;
            prefecture_id: string;
            commune_id: string;
            join_mode: string | null;
            org_name: string | null;
            created_at: string | null;
        }[];
    }>;
    getById(accessToken: string, memberId: string): Promise<{
        id: string;
        user_id: string;
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        email: string | null;
        status: string | null;
        region_id: string;
        prefecture_id: string;
        commune_id: string;
        join_mode: string | null;
        org_name: string | null;
        created_at: string | null;
    } | null>;
    getCurrent(accessToken: string): Promise<{
        id: string;
        user_id: string;
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        email: string | null;
        status: string | null;
        region_id: string;
        prefecture_id: string;
        commune_id: string;
        join_mode: string | null;
        org_name: string | null;
        created_at: string | null;
    } | null>;
    update(accessToken: string, memberId: string, payload: UpdateMemberDto): Promise<{
        id: string;
        user_id: string;
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        email: string | null;
        status: string | null;
        region_id: string;
        prefecture_id: string;
        commune_id: string;
        join_mode: string | null;
        org_name: string | null;
        created_at: string | null;
    } | null>;
    updateCurrent(accessToken: string, payload: UpdateMemberDto): Promise<{
        id: string;
        user_id: string;
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        email: string | null;
        status: string | null;
        region_id: string;
        prefecture_id: string;
        commune_id: string;
        join_mode: string | null;
        org_name: string | null;
        created_at: string | null;
    } | null>;
    private positiveInt;
    private getCurrentUserId;
}
export {};
