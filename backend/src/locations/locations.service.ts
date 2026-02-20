import { Injectable } from '@nestjs/common';

import { SupabaseDataService } from '../infra/supabase-data.service';

@Injectable()
export class LocationsService {
  constructor(private readonly supabaseDataService: SupabaseDataService) {}

  async list(accessToken: string) {
    const client = this.supabaseDataService.forUser(accessToken);

    const [regionsResult, prefecturesResult, communesResult] =
      await Promise.all([
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
}
