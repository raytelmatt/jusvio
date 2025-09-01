import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import MatterDetail from '../MatterDetail'
import { databases } from '../../lib/appwrite'

// Mock the appwrite client
vi.mock('../../lib/appwrite', () => ({
  databases: {
    getDocument: vi.fn(),
    listDocuments: vi.fn(),
    updateDocument: vi.fn(),
    createDocument: vi.fn(),
    deleteDocument: vi.fn(),
  },
  DATABASE_ID: 'jusivo',
}))

// Mock DocumentPreview component
vi.mock('../../components/DocumentPreview', () => ({
  default: vi.fn(() => null),
}))

const mockMatter = {
  $id: 'test-matter-id',
  id: 'test-matter-id',
  matter_number: 'MT123456',
  title: 'Test Matter Case',
  practice_area: 'Criminal',
  status: 'Open',
  client_id: 1,
  client_first_name: 'John',
  client_last_name: 'Doe',
  client_email: 'john.doe@example.com',
  description: 'Test matter description',
  fee_model: 'FlatRate',
  flat_rate_amount: 5000,
  opened_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  criminal_data: {
    case_number: 'CR-2024-001',
    charges: 'Test charges',
    jurisdiction: 'Test County',
    arrest_date: '2023-12-01',
    disposition: 'Pending',
  },
}

const mockDocuments = [
  {
    id: 'doc1',
    $id: 'doc1',
    title: 'Test Document 1',
    created_at: '2024-01-02T00:00:00Z',
    status: 'Final',
    version: 1,
  },
  {
    id: 'doc2',
    $id: 'doc2',
    title: 'Test Document 2',
    created_at: '2024-01-03T00:00:00Z',
    status: 'Draft',
    version: 2,
  },
]

const mockCommunications = [
  {
    id: 'comm1',
    $id: 'comm1',
    subject: 'Test Communication',
    content: 'This is a test communication message',
    created_at: '2024-01-04T00:00:00Z',
    channel: 'Email',
    direction: 'Inbound',
    body: 'Test communication body',
  },
]

const mockInvoices = [
  {
    id: 'inv1',
    $id: 'inv1',
    invoice_number: 'INV-001',
    amount: 1000,
    total: 1000,
    due_date: '2024-02-01T00:00:00Z',
    status: 'Sent',
  },
]

const renderComponent = (id = 'test-matter-id') => {
  return render(
    <MemoryRouter initialEntries={[`/matters/${id}`]}>
      <Routes>
        <Route path="/matters/:id" element={<MatterDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('MatterDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mock responses
    ;(databases.getDocument as any).mockResolvedValue(mockMatter)
    ;(databases.listDocuments as any).mockResolvedValue({ documents: [] })
  })

  describe('Component Loading', () => {
    it('should display loading state initially', () => {
      renderComponent()
      expect(screen.getByText(/Matters/)).toBeInTheDocument()
    })

    it('should fetch and display matter details', async () => {
      ;(databases.listDocuments as any).mockImplementation((db: string, collection: string) => {
        if (collection === 'invoices') {
          return Promise.resolve({ documents: mockInvoices })
        }
        return Promise.resolve({ documents: [] })
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Test Matter Case')).toBeInTheDocument()
        expect(screen.getByText('Matter #MT123456')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('should display error state when matter fetch fails', async () => {
      const errorMessage = 'Failed to fetch matter'
      ;(databases.getDocument as any).mockRejectedValue(new Error(errorMessage))

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Error Loading Matter')).toBeInTheDocument()
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('should display not found message for invalid matter', async () => {
      ;(databases.getDocument as any).mockResolvedValue(null)

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Matter not found')).toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation', () => {
    beforeEach(async () => {
      ;(databases.listDocuments as any).mockImplementation((db: string, collection: string) => {
        if (collection === 'invoices') {
          return Promise.resolve({ documents: mockInvoices })
        }
        return Promise.resolve({ documents: [] })
      })

      renderComponent()
      await waitFor(() => {
        expect(screen.getByText('Test Matter Case')).toBeInTheDocument()
      })
    })

    it('should display overview tab by default', async () => {
      const overviewTab = screen.getByRole('button', { name: /Overview/i })
      expect(overviewTab).toHaveClass('text-blue-300')
    })

    it('should switch to documents tab when clicked', async () => {
      ;(databases.listDocuments as any).mockImplementation((db: string, collection: string) => {
        if (collection === 'documents') {
          return Promise.resolve({ documents: mockDocuments })
        }
        if (collection === 'invoices') {
          return Promise.resolve({ documents: mockInvoices })
        }
        return Promise.resolve({ documents: [] })
      })

      const documentsTab = screen.getByRole('button', { name: /Documents/i })
      await userEvent.click(documentsTab)

      await waitFor(() => {
        expect(screen.getByText('Test Document 1')).toBeInTheDocument()
        expect(screen.getByText('Test Document 2')).toBeInTheDocument()
      })
    })

    it('should switch to communications tab when clicked', async () => {
      ;(databases.listDocuments as any).mockImplementation((db: string, collection: string) => {
        if (collection === 'communications') {
          return Promise.resolve({ documents: mockCommunications })
        }
        if (collection === 'invoices') {
          return Promise.resolve({ documents: mockInvoices })
        }
        return Promise.resolve({ documents: [] })
      })

      const communicationsTab = screen.getByRole('button', { name: /Communications/i })
      await userEvent.click(communicationsTab)

      await waitFor(() => {
        expect(screen.getByText('Test Communication')).toBeInTheDocument()
        expect(screen.getByText('This is a test communication message')).toBeInTheDocument()
      })
    })

    it('should switch to billing tab when clicked', async () => {
      const billingTab = screen.getByRole('button', { name: /Billing/i })
      await userEvent.click(billingTab)

      await waitFor(() => {
        expect(screen.getByText('Billing & Invoices')).toBeInTheDocument()
        expect(screen.getByText('Invoice #INV-001')).toBeInTheDocument()
      })
    })
  })

  describe('Criminal Case Data', () => {
    it('should display criminal case information in overview tab', async () => {
      ;(databases.listDocuments as any).mockImplementation((db: string, collection: string) => {
        if (collection === 'invoices') {
          return Promise.resolve({ documents: mockInvoices })
        }
        return Promise.resolve({ documents: [] })
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Test Matter Case')).toBeInTheDocument()
      })

      // Check for criminal case specific fields
      expect(screen.getByText('Case Information')).toBeInTheDocument()
      expect(screen.getByDisplayValue('CR-2024-001')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test charges')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test County')).toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    it('should toggle edit mode when Edit button is clicked', async () => {
      ;(databases.listDocuments as any).mockImplementation((db: string, collection: string) => {
        if (collection === 'invoices') {
          return Promise.resolve({ documents: mockInvoices })
        }
        return Promise.resolve({ documents: [] })
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Test Matter Case')).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /Edit/i })
      await userEvent.click(editButton)

      // Button text should change to Cancel
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    })

    it('should show Save Changes button', async () => {
      ;(databases.listDocuments as any).mockImplementation((db: string, collection: string) => {
        if (collection === 'invoices') {
          return Promise.resolve({ documents: mockInvoices })
        }
        return Promise.resolve({ documents: [] })
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Test Matter Case')).toBeInTheDocument()
      })

      const saveButton = screen.getByRole('button', { name: /Save Changes/i })
      expect(saveButton).toBeInTheDocument()
      
      // Test save button click
      await userEvent.click(saveButton)
      // The component shows an alert for now
    })
  })

  describe('Data Fetching', () => {
    it('should fetch timeline events when timeline tab is clicked', async () => {
      ;(databases.listDocuments as any).mockImplementation((db: string, collection: string) => {
        if (collection === 'invoices') {
          return Promise.resolve({ documents: mockInvoices })
        }
        return Promise.resolve({ documents: [] })
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Test Matter Case')).toBeInTheDocument()
      })

      const timelineTab = screen.getByRole('button', { name: /Timeline/i })
      await userEvent.click(timelineTab)

      await waitFor(() => {
        expect(databases.listDocuments).toHaveBeenCalledWith(
          'jusivo',
          'time_entries',
          expect.any(Array)
        )
        expect(databases.listDocuments).toHaveBeenCalledWith(
          'jusivo',
          'hearings',
          expect.any(Array)
        )
        expect(databases.listDocuments).toHaveBeenCalledWith(
          'jusivo',
          'deadlines',
          expect.any(Array)
        )
      })
    })

    it('should refresh documents when Refresh Documents button is clicked', async () => {
      ;(databases.listDocuments as any).mockImplementation((db: string, collection: string) => {
        if (collection === 'documents') {
          return Promise.resolve({ documents: mockDocuments })
        }
        if (collection === 'invoices') {
          return Promise.resolve({ documents: mockInvoices })
        }
        return Promise.resolve({ documents: [] })
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Test Matter Case')).toBeInTheDocument()
      })

      const documentsTab = screen.getByRole('button', { name: /Documents/i })
      await userEvent.click(documentsTab)

      await waitFor(() => {
        expect(screen.getByText('Test Document 1')).toBeInTheDocument()
      })

      const refreshButton = screen.getByRole('button', { name: /Refresh Documents/i })
      await userEvent.click(refreshButton)

      expect(databases.listDocuments).toHaveBeenCalledWith(
        'jusivo',
        'documents',
        expect.any(Array)
      )
    })
  })

  describe('Practice Area and Status Badges', () => {
    it('should display correct practice area badge color for Criminal', async () => {
      ;(databases.listDocuments as any).mockImplementation((db: string, collection: string) => {
        if (collection === 'invoices') {
          return Promise.resolve({ documents: mockInvoices })
        }
        return Promise.resolve({ documents: [] })
      })

      renderComponent()

      await waitFor(() => {
        const badge = screen.getByText('Criminal')
        expect(badge).toHaveClass('bg-red-100', 'text-red-800')
      })
    })

    it('should display correct status badge color for Open', async () => {
      ;(databases.listDocuments as any).mockImplementation((db: string, collection: string) => {
        if (collection === 'invoices') {
          return Promise.resolve({ documents: mockInvoices })
        }
        return Promise.resolve({ documents: [] })
      })

      renderComponent()

      await waitFor(() => {
        const badge = screen.getByText('Open')
        expect(badge).toHaveClass('bg-green-100', 'text-green-800')
      })
    })
  })

  describe('Empty States', () => {
    it('should display empty state for documents', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Test Matter Case')).toBeInTheDocument()
      })

      const documentsTab = screen.getByRole('button', { name: /Documents/i })
      await userEvent.click(documentsTab)

      await waitFor(() => {
        expect(screen.getByText('No documents found for this matter.')).toBeInTheDocument()
      })
    })

    it('should display empty state for communications', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Test Matter Case')).toBeInTheDocument()
      })

      const communicationsTab = screen.getByRole('button', { name: /Communications/i })
      await userEvent.click(communicationsTab)

      await waitFor(() => {
        expect(screen.getByText('No communications found for this matter.')).toBeInTheDocument()
      })
    })

    it('should display empty state for invoices', async () => {
      ;(databases.listDocuments as any).mockImplementation((db: string, collection: string) => {
        return Promise.resolve({ documents: [] })
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Test Matter Case')).toBeInTheDocument()
      })

      const billingTab = screen.getByRole('button', { name: /Billing/i })
      await userEvent.click(billingTab)

      await waitFor(() => {
        expect(screen.getByText('No invoices found for this matter.')).toBeInTheDocument()
      })
    })
  })
})
