import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      service: 'czi-backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
