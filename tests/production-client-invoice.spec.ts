import { test, expect } from '@playwright/test';

const BASE_URL = 'https://jusivo.com';
const TEST_EMAIL = 'iahmatt@icloud.com';
const TEST_PASSWORD = 'Kb5teh04';

test.describe('Production client + invoice flow', () => {
  test('should create client, matter, invoice, and record payment', async ({ page }) => {
    test.setTimeout(240000);

    const timestamp = Date.now();
    const clientFirstName = `Auto${timestamp}`;
    const clientLastName = 'Client';
    const clientEmail = `auto${timestamp}@example.com`;
    const clientPhone = '555-123-4567';
    const emergencyPhone = '555-765-4321';
    const matterTitle = `Automation Matter ${timestamp}`;
    const matterDescription = 'Automated test matter created via Playwright';
    const invoiceDescription = 'Automation legal services';
    const invoiceAmount = '1000';

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 60000 });

    await page.getByRole('link', { name: 'Clients' }).click();
    await expect(page).toHaveURL(/\/clients/, { timeout: 60000 });

    await page.getByRole('button', { name: 'Add Client' }).click();
    await expect(page).toHaveURL(/\/clients\/new/, { timeout: 30000 });

    await page.getByPlaceholder('Enter first name').fill(clientFirstName);
    await page.getByPlaceholder('Enter last name').fill(clientLastName);
    await page.locator('#date_of_birth').fill('1990-05-15');
    await page.getByPlaceholder('XXXX').fill('1234');
    await page.getByPlaceholder('Enter email address').fill(clientEmail);
    await page.getByPlaceholder('Enter phone number').fill(clientPhone);
    await page.locator('#preferred_contact_method').selectOption('Email');
    await page.getByPlaceholder('Enter street address').fill('123 Main St');
    await page.getByPlaceholder('Enter city').fill('Nashville');
    await page.getByPlaceholder('State').fill('TN');
    await page.getByPlaceholder('ZIP').fill('37201');
    await page.getByPlaceholder('Contact name').fill('Jane Doe');
    await page.getByPlaceholder('Relationship').fill('Spouse');
    await page.getByPlaceholder('Contact phone').fill(emergencyPhone);

    await page.getByRole('button', { name: 'Create Client' }).click();

    await expect(page.getByRole('heading', { name: `${clientFirstName} ${clientLastName}` })).toBeVisible({ timeout: 60000 });

    await page.getByRole('button', { name: 'Matters' }).click();
    await page.getByRole('button', { name: 'New Matter' }).click();
    await expect(page).toHaveURL(/\/matters\/new/, { timeout: 30000 });

    await page.locator('#client_id').selectOption({ label: `${clientFirstName} ${clientLastName}` });
    await page.getByPlaceholder('e.g., State v. Smith - DUI Defense').fill(matterTitle);
    await page.locator('#practice_area').selectOption('Criminal');
    await page.getByPlaceholder('Brief description of the case...').fill(matterDescription);

    await page.getByRole('button', { name: 'Create Matter' }).click();

    await expect(page.getByRole('heading', { name: matterTitle })).toBeVisible({ timeout: 60000 });

    await page.getByRole('button', { name: 'Billing' }).click();
    await page.getByRole('button', { name: 'Generate Invoice' }).click();

    const invoiceModal = page.locator('div').filter({ has: page.getByRole('heading', { name: 'Generate Invoice' }) }).first();
    await expect(invoiceModal).toBeVisible();

    const issueDateInput = invoiceModal.locator('#invoice_issue_date');
    const dueDateInput = invoiceModal.locator('#invoice_due_date');
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await issueDateInput.fill(today);
    await dueDateInput.fill(dueDate);

    await invoiceModal.getByRole('button', { name: 'Add Custom Item' }).click();

    const descriptionInput = invoiceModal.getByPlaceholder('Description').first();
    const quantityInput = invoiceModal.getByPlaceholder('Qty').first();
    const rateInput = invoiceModal.getByPlaceholder('Rate').first();

    await descriptionInput.fill(invoiceDescription);
    await quantityInput.fill('1');
    await rateInput.fill(invoiceAmount);

    await expect(invoiceModal.getByText('$1,000.00')).toBeVisible({ timeout: 10000 });

    await invoiceModal.getByRole('button', { name: 'Generate Invoice' }).click();

    const invoiceSection = page.locator('div').filter({ hasText: 'Invoices' }).first();
    await expect(invoiceSection.getByText('$1,000.00')).toBeVisible({ timeout: 60000 });

    const invoiceCard = page.locator('div').filter({ has: page.getByRole('heading', { name: /Invoice #/ }) }).first();
    await expect(invoiceCard).toContainText('$1,000.00', { timeout: 60000 });

    await invoiceCard.getByRole('button', { name: 'Record Payment' }).click();

    const paymentModal = page.locator('div').filter({ has: page.getByRole('heading', { name: 'Record Payment' }) }).first();
    await expect(paymentModal).toBeVisible();

    await paymentModal.locator('#payment-amount').fill(invoiceAmount);
    await paymentModal.locator('#payment-method').selectOption('Card');
    await paymentModal.locator('#payment-reference').fill('Automation payment');
    await paymentModal.getByRole('button', { name: 'Record Payment' }).click();

    await expect(invoiceCard).toContainText('Paid', { timeout: 60000 });
    await expect(invoiceCard).toContainText('Paid: $1,000.00', { timeout: 60000 });
  });
});
