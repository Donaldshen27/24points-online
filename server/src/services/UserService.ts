import { supabase } from '../db/supabase';
import { v4 as uuidv4 } from 'uuid';

export class UserService {
  /**
   * Check if a user ID is a valid UUID
   */
  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Ensure a user exists in the users table
   * Creates a guest user if they don't exist
   * Only creates users for valid UUIDs (not guest IDs)
   */
  async ensureUserExists(userId: string, username: string): Promise<boolean> {
    // Guest users (non-UUID) don't need entries in the users table
    if (!this.isValidUUID(userId)) {
      console.log(`[UserService] Skipping user creation for guest ID: ${userId}`);
      return true; // Return true to allow them to continue
    }
    if (!supabase) {
      console.warn('[UserService] Supabase not configured, skipping user creation');
      return false;
    }

    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingUser) {
        return true; // User already exists
      }

      // Create guest user with minimal required fields
      const guestEmail = `guest_${userId.substring(0, 8)}@24points.local`;
      let guestUsername = username || `Guest_${userId.substring(0, 8)}`;
      
      // Ensure username uniqueness by appending random suffix if needed
      let attempts = 0;
      let created = false;
      
      while (!created && attempts < 5) {
        try {
          const { data, error } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: attempts === 0 ? guestEmail : `guest_${userId.substring(0, 8)}_${attempts}@24points.local`,
              username: attempts === 0 ? guestUsername : `${guestUsername}_${Math.random().toString(36).substring(2, 5)}`,
              password_hash: 'GUEST_ACCOUNT', // Not used for guest accounts
              display_name: username,
              is_verified: false,
              is_active: true
            })
            .select()
            .single();

          if (error) {
            if (error.code === '23505') { // Unique constraint violation
              attempts++;
              continue;
            }
            throw error;
          }
          
          created = true;
          console.log(`[UserService] Created guest user: ${data.username} (${userId})`);
          return true;
        } catch (innerError) {
          if (attempts >= 4) {
            throw innerError;
          }
          attempts++;
        }
      }
      
      return false; // Failed to create after all attempts
    } catch (error) {
      console.error('[UserService] Error ensuring user exists:', error);
      return false;
    }
  }

  /**
   * Create or update a user's username
   */
  async updateUsername(userId: string, newUsername: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: newUsername,
          display_name: newUsername,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('[UserService] Error updating username:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[UserService] Error updating username:', error);
      return false;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[UserService] Error getting user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[UserService] Error getting user:', error);
      return null;
    }
  }
}

// Singleton instance
export const userService = new UserService();