import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Challenges.me API')
  .setDescription('Social habit and challenge platform API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
