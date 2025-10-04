/**
 * Test utility to verify billing system fixes
 * Run this in the browser console after logging in
 */

import { databases, DATABASE_ID, COLLECTIONS, Query } from './lib/backend';

export async function testBillingFix() {
  console.log('🔍 Testing Billing System Fixes...\n');
  
  try {
    // 1. Find Kitty Galore client
    console.log('1. Finding Kitty Galore client...');
    const clientsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.clients,
      [Query.limit(500)]
    );
    
    const kittyClient = clientsResponse.documents.find(
      (client: any) => client.last_name === 'Galore' && client.first_name === 'Kitty'
    );
    
    if (!kittyClient) {
      console.log('   ❌ Client "Kitty Galore" not found');
      return;
    }
    
    const clientId = String(kittyClient.$id || kittyClient.id);
    console.log(`   ✅ Found client: ${kittyClient.first_name} ${kittyClient.last_name}`);
    console.log(`      Client ID: ${clientId}`);
    console.log(`      Email: ${kittyClient.email || 'N/A'}`);
    
    // 2. Find matters for this client - try both string and original format
    console.log('\n2. Finding matters for client...');
    
    // First try with the client ID as string
    let mattersResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.matters,
      [Query.equal('client_id', clientId), Query.limit(100)]
    );
    
    if (mattersResponse.documents.length === 0) {
      console.log('   No matters found with client_id as string, trying numeric...');
      // Try with numeric if string doesn't work
      const numericId = Number(clientId);
      if (!isNaN(numericId)) {
        mattersResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.matters,
          [Query.equal('client_id', numericId), Query.limit(100)]
        );
      }
    }
    
    const clientMatters = mattersResponse.documents;
    
    if (clientMatters.length === 0) {
      console.log('   ❌ No matters found for this client');
      console.log('   ⚠️  This is the root cause of the billing issue!');
      
      // Check all matters to see what client_id values exist
      const allMattersResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.matters,
        [Query.limit(100)]
      );
      
      console.log('\n   Checking client_id values in all matters:');
      const clientIdSample = new Set();
      allMattersResponse.documents.forEach((matter: any) => {
        if (matter.title?.includes('Galore') || matter.title?.includes('Kitty')) {
          console.log(`   Found potentially related matter: "${matter.title}"`);
          console.log(`     - client_id: ${JSON.stringify(matter.client_id)} (type: ${typeof matter.client_id})`);
          console.log(`     - matter_number: ${matter.matter_number}`);
        }
        clientIdSample.add(`${typeof matter.client_id}: ${JSON.stringify(matter.client_id)}`);
      });
      
      console.log('\n   Sample of client_id types in database:');
      Array.from(clientIdSample).slice(0, 5).forEach(sample => {
        console.log(`     ${sample}`);
      });
      
    } else {
      console.log(`   ✅ Found ${clientMatters.length} matter(s)`);
      clientMatters.forEach((matter: any) => {
        console.log(`      - ${matter.title} (${matter.matter_number})`);
        console.log(`        Status: ${matter.status}, client_id: ${JSON.stringify(matter.client_id)}`);
      });
    }
    
    // 3. Check invoices
    console.log('\n3. Checking invoices...');
    const invoicesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.invoices,
      [Query.limit(1000)]
    );
    
    let kittyInvoices: any[] = [];
    const matterIds = clientMatters.map((m: any) => m.$id || m.id);
    
    invoicesResponse.documents.forEach((invoice: any) => {
      const invoiceMatterId = invoice.matter_id;
      if (matterIds.includes(invoiceMatterId)) {
        kittyInvoices.push({
          invoice_number: invoice.invoice_number,
          status: invoice.status,
          total: invoice.total || invoice.amount || 0,
          matter_id: invoiceMatterId
        });
      }
    });
    
    if (kittyInvoices.length > 0) {
      console.log(`   ✅ Found ${kittyInvoices.length} invoice(s) for Kitty's matters:`);
      let totalAmount = 0;
      kittyInvoices.forEach(inv => {
        console.log(`      - ${inv.invoice_number}: $${inv.total} (${inv.status})`);
        totalAmount += inv.total;
      });
      console.log(`   Total invoiced: $${totalAmount}`);
    } else {
      console.log('   ❌ No invoices found for Kitty\'s matters');
      
      // Check if there are any invoices that might be related
      console.log('\n   Checking for invoices with "Galore" in matter title...');
      const relatedInvoices = invoicesResponse.documents.filter((inv: any) => 
        inv.matter_title?.includes('Galore') || inv.client_name?.includes('Galore')
      );
      
      if (relatedInvoices.length > 0) {
        console.log(`   Found ${relatedInvoices.length} potentially related invoice(s):`);
        relatedInvoices.forEach((inv: any) => {
          console.log(`     - ${inv.invoice_number}: matter_id=${inv.matter_id}`);
        });
      }
    }
    
    // 4. Test the balance calculation
    console.log('\n4. Testing balance calculation...');
    const { fetchClientBalances } = await import('./lib/client-balances');
    const balances = await fetchClientBalances();
    
    const kittyBalance = balances.find(b => b.client_id === clientId);
    
    if (kittyBalance) {
      console.log('   ✅ Client balance found:');
      console.log(`      Total Invoiced: $${kittyBalance.total_invoiced}`);
      console.log(`      Total Paid: $${kittyBalance.total_paid}`);
      console.log(`      Current Balance: $${kittyBalance.current_balance}`);
      console.log(`      Outstanding Invoices: ${kittyBalance.outstanding_invoices}`);
      
      if (kittyBalance.matter_balances && kittyBalance.matter_balances.length > 0) {
        console.log('      Matter balances:');
        kittyBalance.matter_balances.forEach(mb => {
          console.log(`        - ${mb.matter_title}: $${mb.balance}`);
        });
      }
    } else {
      console.log('   ❌ No balance record found for client');
    }
    
    // 5. Summary
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(50));
    
    if (clientMatters.length === 0) {
      console.log('❌ ISSUE CONFIRMED: Client-matter association is broken');
      console.log(`   Client ID in database: "${clientId}"`);
      console.log('   No matters found with matching client_id');
      console.log('\n💡 FIX APPLIED:');
      console.log('   ✅ Updated client-balances.ts to handle client_id correctly');
      console.log('   ✅ Updated NewMatter.tsx to save correct client_id');
      console.log('   ⚠️  Existing matters may need manual correction');
    } else if (kittyBalance && kittyBalance.total_invoiced > 0) {
      console.log('✅ Billing system is working correctly!');
      console.log(`   Client has ${clientMatters.length} matter(s)`);
      console.log(`   Total invoiced: $${kittyBalance.total_invoiced}`);
      console.log(`   Outstanding balance: $${kittyBalance.current_balance}`);
    } else {
      console.log('⚠️  Partial issue detected');
      console.log(`   Matters found: ${clientMatters.length}`);
      console.log(`   Invoices found: ${kittyInvoices.length}`);
      console.log('   Balance calculation may need further investigation');
    }
    
    return {
      clientId,
      mattersCount: clientMatters.length,
      invoicesCount: kittyInvoices.length,
      totalInvoiced: kittyBalance?.total_invoiced || 0,
      currentBalance: kittyBalance?.current_balance || 0
    };
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    throw error;
  }
}

// Export for use in browser console
(window as any).testBillingFix = testBillingFix;