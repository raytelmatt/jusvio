export interface Env {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_KEY: string;
  MOCHA_USERS_SERVICE_API_URL: string;
  DOCUMENTS_BUCKET: R2Bucket;
  SENDGRID_API_KEY?: string;
}
