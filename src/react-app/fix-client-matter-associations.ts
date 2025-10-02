/**
 * Utility to fix client-matter associations
 * This will update matters that have incorrect client_id values
 */

import { databases, DATABASE_ID, COLLECTIONS, Query } from './lib/backend';

export async function fixClientMatterAssociations(dryRun = true) {
  console.log(`🔧 ${dryRun ? 'Analyzing' : 'Fixing'} Client-Matter Associations...\n`);
  
  try {
    // 1. Get all clients
    console.log('1. Fetching all clients...');
    const clientsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.clients,
      [Query.limit(1000)]
    );
    
    const clients = clientsResponse.documents;
    console.log(`   Found ${clients.length} clients`);
    
    // Create a map of client names to IDs for matching
    const clientMap = new Map();
    clients.forEach((client: any) => {
      const clientId = String(client.$id || client.id);
      const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
      clientMap.set(fullName, clientId);
      
      // Also map by email if available
      if (client.email) {
        clientMap.set(client.email.toLowerCase(), clientId);
      }
    });
    
    // 2. Get all matters
    console.log('\n2. Fetching all matters...');
    const mattersResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.matters,
      [Query.limit(1000)]
    );
    
    const matters = mattersResponse.documents;
    console.log(`   Found ${matters.length} matters`);
    
    // 3. Analyze matters for issues
    console.log('\n3. Analyzing matters for client_id issues...');
    
    const issuesByType = {
      missingClientId: [],
      numericClientId: [],
      invalidClientId: [],
      orphanedMatters: []
    } as any;
    
    const validClientIds = new Set(clients.map((c: any) => String(c.$id || c.id)));
    
    for (const matter of matters) {
      const matterId = matter.$id || matter.id;
      const clientId = matter.client_id;
      
      if (!clientId) {
        issuesByType.missingClientId.push(matter);
      } else if (typeof clientId === 'number') {
        issuesByType.numericClientId.push(matter);
      } else if (!validClientIds.has(String(clientId))) {
        issuesByType.invalidClientId.push(matter);
      }
    }
    
    // 4. Report findings
    console.log('\n📊 Issues Found:');
    console.log(`   Missing client_id: ${issuesByType.missingClientId.length}`);
    console.log(`   Numeric client_id: ${issuesByType.numericClientId.length}`);
    console.log(`   Invalid client_id: ${issuesByType.invalidClientId.length}`);
    
    // 5. Attempt to fix issues
    const fixes: any[] = [];
    
    // Fix orphaned matters by matching title patterns
    for (const matter of [...issuesByType.invalidClientId, ...issuesByType.numericClientId]) {
      const title = matter.title || '';
      
      // Try to extract client name from title (e.g., "State v. John Doe")
      const patterns = [
        /State.*?vs?\.\s+(.+?)(?:\s+-|$)/i,
        /v\.\s+(.+?)(?:\s+-|$)/i,
        /for\s+(.+?)(?:\s+-|$)/i
      ];
      
      let clientName = null;
      for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match) {
          clientName = match[1].trim();
          break;
        }
      }
      
      if (clientName) {
        // Try to find matching client
        const normalizedName = clientName.toLowerCase();
        let newClientId = null;
        
        // Check exact match
        if (clientMap.has(normalizedName)) {
          newClientId = clientMap.get(normalizedName);
        } else {
          // Try partial matches
          for (const [key, id] of clientMap.entries()) {
            if (key.includes(normalizedName) || normalizedName.includes(key)) {
              newClientId = id;
              break;
            }
          }
        }
        
        if (newClientId) {
          fixes.push({
            matterId: matter.$id || matter.id,
            matterTitle: title,
            oldClientId: matter.client_id,
            newClientId: newClientId,
            matchedBy: clientName
          });
        }
      }
    }
    
    // 6. Apply fixes if not dry run
    if (fixes.length > 0) {
      console.log(`\n🔧 Proposed Fixes: ${fixes.length}`);
      
      for (const fix of fixes.slice(0, 10)) { // Show first 10
        console.log(`   Matter: "${fix.matterTitle}"`);
        console.log(`     Old client_id: ${JSON.stringify(fix.oldClientId)}`);
        console.log(`     New client_id: ${fix.newClientId}`);
        console.log(`     Matched by: "${fix.matchedBy}"`);
      }
      
      if (fixes.length > 10) {
        console.log(`   ... and ${fixes.length - 10} more`);
      }
      
      if (!dryRun) {
        console.log('\n⚡ Applying fixes...');
        let successCount = 0;
        let errorCount = 0;
        
        for (const fix of fixes) {
          try {
            await databases.updateDocument(
              DATABASE_ID,
              COLLECTIONS.matters,
              fix.matterId,
              { client_id: fix.newClientId }
            );
            successCount++;
            console.log(`   ✅ Fixed matter: ${fix.matterTitle}`);
          } catch (error) {
            errorCount++;
            console.error(`   ❌ Failed to fix matter ${fix.matterId}:`, error);
          }
        }
        
        console.log(`\n✅ Successfully fixed ${successCount} matters`);
        if (errorCount > 0) {
          console.log(`❌ Failed to fix ${errorCount} matters`);
        }
      } else {
        console.log('\n💡 This was a dry run. To apply fixes, run:');
        console.log('   fixClientMatterAssociations(false)');
      }
    } else {
      console.log('\n✅ No fixable issues found');
    }
    
    // 7. Special check for Kitty Galore
    console.log('\n🔍 Checking Kitty Galore specifically...');
    const kittyClient = clients.find((c: any) => 
      c.last_name === 'Galore' && c.first_name === 'Kitty'
    );
    
    if (kittyClient) {
      const kittyId = String(kittyClient.$id || kittyClient.id);
      console.log(`   Kitty Galore client ID: ${kittyId}`);
      
      // Find matters that should belong to Kitty
      const kittyMatters = matters.filter((m: any) => 
        m.title?.includes('Galore') || 
        m.title?.includes('Kitty') ||
        m.title?.includes('Texa') // "State of Texa vs. Kitty Galore"
      );
      
      if (kittyMatters.length > 0) {
        console.log(`   Found ${kittyMatters.length} potential Kitty Galore matter(s):`);
        
        for (const matter of kittyMatters) {
          const currentClientId = matter.client_id;
          const needsFix = currentClientId !== kittyId;
          
          console.log(`     - ${matter.title}`);
          console.log(`       Current client_id: ${JSON.stringify(currentClientId)}`);
          console.log(`       ${needsFix ? '❌ Needs fix' : '✅ Correct'}`);
          
          if (needsFix && !dryRun) {
            try {
              await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.matters,
                matter.$id || matter.id,
                { client_id: kittyId }
              );
              console.log(`       ✅ Fixed!`);
            } catch (error) {
              console.error(`       ❌ Failed to fix:`, error);
            }
          }
        }
      } else {
        console.log('   No Kitty Galore matters found');
      }
    } else {
      console.log('   Kitty Galore client not found');
    }
    
    return {
      totalClients: clients.length,
      totalMatters: matters.length,
      issues: {
        missingClientId: issuesByType.missingClientId.length,
        numericClientId: issuesByType.numericClientId.length,
        invalidClientId: issuesByType.invalidClientId.length
      },
      proposedFixes: fixes.length,
      applied: !dryRun
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Export for use in browser console
(window as any).fixClientMatterAssociations = fixClientMatterAssociations;