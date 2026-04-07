import { readFileSync } from 'fs';
import path from 'path';
import { Platform } from './types';

export type { Platform };

export function loadPlatforms(): Platform[] {
  try {
    const filePath = path.join(process.cwd(), 'src/lib/platforms/platforms.json');
    const data = readFileSync(filePath, 'utf-8');
    const platforms: Platform[] = JSON.parse(data);

    // Validate that all platforms have required fields
    platforms.forEach(platform => {
      if (!platform.channel || !platform.fit_scoring_matrix || !platform.content_system) {
        throw new Error(`Invalid platform data for ${platform.channel}`);
      }
    });

    return platforms;
  } catch (error) {
    console.error('Error loading platforms:', error);
    throw new Error('Failed to load platform data');
  }
}