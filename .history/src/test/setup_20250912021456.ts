import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'

// No provider SDK mocks needed; mock backend facade if desired

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
