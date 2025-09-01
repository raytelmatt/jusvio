import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'

// Mock Appwrite SDK
vi.mock('appwrite', () => ({
  Client: vi.fn(() => ({
    setEndpoint: vi.fn().mockReturnThis(),
    setProject: vi.fn().mockReturnThis(),
  })),
  Account: vi.fn(() => ({
    get: vi.fn(),
    createOAuth2Session: vi.fn(),
    createEmailPasswordSession: vi.fn(),
    deleteSession: vi.fn(),
  })),
  Databases: vi.fn(() => ({
    listDocuments: vi.fn(),
    getDocument: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  })),
  Storage: vi.fn(() => ({
    createFile: vi.fn(),
    getFile: vi.fn(),
    getFilePreview: vi.fn(),
    deleteFile: vi.fn(),
  })),
  Query: {
    equal: vi.fn((field, value) => `${field}=${value}`),
    notEqual: vi.fn((field, value) => `${field}!=${value}`),
    lessThan: vi.fn((field, value) => `${field}<${value}`),
    greaterThan: vi.fn((field, value) => `${field}>${value}`),
    search: vi.fn((field, value) => `${field}~${value}`),
    orderDesc: vi.fn((field) => `orderDesc(${field})`),
    orderAsc: vi.fn((field) => `orderAsc(${field})`),
    limit: vi.fn((value) => `limit(${value})`),
    offset: vi.fn((value) => `offset(${value})`),
  },
  Permission: {
    read: vi.fn((role) => `read(${role})`),
    write: vi.fn((role) => `write(${role})`),
    update: vi.fn((role) => `update(${role})`),
    delete: vi.fn((role) => `delete(${role})`),
  },
  Role: {
    any: vi.fn(() => 'any'),
    user: vi.fn((id) => `user:${id}`),
    users: vi.fn(() => 'users'),
    guests: vi.fn(() => 'guests'),
    team: vi.fn((id) => `team:${id}`),
    member: vi.fn((id) => `member:${id}`),
  },
  ID: {
    unique: vi.fn(() => `unique_${Date.now()}`),
  },
}))

// Mock React Router
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'test-matter-id' }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

beforeAll(() => {
  // Setup any global test configuration
})

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks()
})

afterAll(() => {
  // Cleanup after all tests
})
