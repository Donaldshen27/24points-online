import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { BADGE_DEFINITIONS } from '../badges/badgeDefinitions';

dotenv.config();

async function seedBadges() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Starting badge definitions seed...');
  console.log(`Found ${BADGE_DEFINITIONS.length} badge definitions to insert`);

  // Clear existing badge definitions
  const { error: clearError } = await supabase
    .from('badge_definitions')
    .delete()
    .neq('id', ''); // Delete all rows

  if (clearError) {
    console.error('Error clearing existing badges:', clearError);
  }

  // Insert badge definitions
  let successCount = 0;
  let errorCount = 0;

  for (const badge of BADGE_DEFINITIONS) {
    const { error } = await supabase
      .from('badge_definitions')
      .insert({
        id: badge.id,
        category: badge.category,
        name: badge.name,
        description: badge.description,
        tier: badge.tier || null,
        rarity: badge.rarity,
        points: badge.points,
        requirements: badge.requirements,
        is_active: badge.isActive
      });

    if (error) {
      console.error(`Error inserting badge ${badge.id}:`, error);
      errorCount++;
    } else {
      console.log(`✓ Inserted badge: ${badge.id}`);
      successCount++;
    }
  }

  console.log('\nBadge seeding complete!');
  console.log(`Successfully inserted: ${successCount} badges`);
  console.log(`Errors: ${errorCount}`);
  
  process.exit(errorCount > 0 ? 1 : 0);
}

seedBadges().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});