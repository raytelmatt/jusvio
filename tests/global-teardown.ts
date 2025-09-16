import { FullConfig } from '@playwright/test';
import { unlink } from 'fs/promises';

async function globalTeardown(config: FullConfig) {
  void config;
  console.log('Cleaning up Firebase test artifacts...');
  
  try {
    // Clean up authentication state files
    await unlink('tests/auth-state.json').catch(() => {});
    await unlink('tests/setup-auth-state.json').catch(() => {});
    
    console.log('Global teardown completed.');
  } catch (error) {
    console.error('Global teardown failed:', error);
  }
}

export default globalTeardown;
