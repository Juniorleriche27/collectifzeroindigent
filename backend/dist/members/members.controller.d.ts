import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersService } from './members.service';
export declare class MembersController {
    private readonly membersService;
    constructor(membersService: MembersService);
    list(request: AuthenticatedRequest, query: Record<string, string>): Promise<{
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
    getCurrent(request: AuthenticatedRequest): Promise<{
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
    getById(request: AuthenticatedRequest, memberId: string): Promise<{
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
    updateCurrent(request: AuthenticatedRequest, payload: UpdateMemberDto): Promise<{
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
    update(request: AuthenticatedRequest, memberId: string, payload: UpdateMemberDto): Promise<{
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
}
