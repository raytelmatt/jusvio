
import { 
  getBackendService, 
  DATABASE_ID, 
  COLLECTIONS, 
  BUCKETS,
  setClientJWT as setBackendJWT
} from './backend';

const backend = getBackendService();

export const account = backend.auth;
export const databases = backend.database;
export const storage = backend.storage;
export const Query = backend.Query;

export { DATABASE_ID, COLLECTIONS, BUCKETS };

export function setClientJWT(jwt: string | null) {
  setBackendJWT(jwt);
}

export const appwriteClient = {
  setJWT: setClientJWT
};


