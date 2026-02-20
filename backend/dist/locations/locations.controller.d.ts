import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { LocationsService } from './locations.service';
export declare class LocationsController {
    private readonly locationsService;
    constructor(locationsService: LocationsService);
    list(request: AuthenticatedRequest): Promise<{
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
