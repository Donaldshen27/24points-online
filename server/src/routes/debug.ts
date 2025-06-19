import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Debug endpoint to test database connection
router.get('/health', async (req, res) => {
  const dbConfig = {
    supabaseUrl: process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
    allowedOrigins: process.env.ALLOWED_ORIGINS || 'default'
  };

  // Test database connection if configured
  let dbStatus = 'not configured';
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      
      // Try a simple query
      const { data, error } = await supabase
        .from('puzzles')
        .select('count(*)')
        .limit(1);
      
      if (error) {
        dbStatus = `error: ${error.message}`;
      } else {
        dbStatus = 'connected';
      }
    } catch (e) {
      dbStatus = `exception: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  res.json({
    status: 'ok',
    environment: dbConfig,
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

export default router;