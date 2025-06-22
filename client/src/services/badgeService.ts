import axios from 'axios';
import { Badge, BadgeDefinition, UserStatistics, BadgeProgress } from '../../../shared/types/badges';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3024';

interface BadgeResponse {
  badges: Badge[];
  statistics: UserStatistics | null;
  progress: BadgeProgress[];
}

interface BadgeDefinitionsResponse {
  definitions: BadgeDefinition[];
}

interface BadgeLeaderboardEntry {
  user_id: string;
  username: string;
  total_badges: number;
  total_points: number;
  legendary_count: number;
  epic_count: number;
  rare_count: number;
  common_count: number;
  games_won: number;
  win_rate: number;
  is_guest: boolean;
}

class BadgeService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getUserBadges(): Promise<BadgeResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/badges/me`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user badges:', error);
      return { badges: [], statistics: null, progress: [] };
    }
  }

  async getBadgeDefinitions(): Promise<BadgeDefinition[]> {
    try {
      const response = await axios.get<BadgeDefinitionsResponse>(
        `${API_BASE_URL}/api/badges/definitions`
      );
      return response.data.definitions;
    } catch (error) {
      console.error('Error fetching badge definitions:', error);
      return [];
    }
  }

  async updateFeaturedBadges(badgeIds: string[]): Promise<boolean> {
    try {
      await axios.put(
        `${API_BASE_URL}/api/badges/featured`,
        { badgeIds },
        { headers: this.getAuthHeaders() }
      );
      return true;
    } catch (error) {
      console.error('Error updating featured badges:', error);
      return false;
    }
  }

  async getBadgeLeaderboard(): Promise<BadgeLeaderboardEntry[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/badges/leaderboard`);
      return response.data.leaderboard;
    } catch (error) {
      console.error('Error fetching badge leaderboard:', error);
      return [];
    }
  }

  // Calculate level from badge points
  calculateLevel(totalPoints: number): { level: number; currentLevelPoints: number; nextLevelPoints: number; progress: number } {
    // Level thresholds: 0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500...
    // Formula: Points needed for level n = n * (n + 1) * 50
    
    let level = 0;
    let totalPointsNeeded = 0;
    
    while (totalPointsNeeded <= totalPoints) {
      level++;
      totalPointsNeeded = level * (level + 1) * 50;
    }
    
    level--; // Step back to the last achieved level
    
    const currentLevelPoints = level * (level + 1) * 50;
    const nextLevelPoints = (level + 1) * (level + 2) * 50;
    const pointsInCurrentLevel = totalPoints - currentLevelPoints;
    const pointsNeededForNextLevel = nextLevelPoints - currentLevelPoints;
    const progress = (pointsInCurrentLevel / pointsNeededForNextLevel) * 100;
    
    return {
      level,
      currentLevelPoints,
      nextLevelPoints,
      progress: Math.min(100, Math.max(0, progress))
    };
  }

  // Get badge by ID from local storage or API
  async getBadgeById(badgeId: string): Promise<BadgeDefinition | null> {
    try {
      // First check if we have definitions cached
      const cachedDefinitions = localStorage.getItem('badgeDefinitions');
      if (cachedDefinitions) {
        const definitions: BadgeDefinition[] = JSON.parse(cachedDefinitions);
        const badge = definitions.find(b => b.id === badgeId);
        if (badge) return badge;
      }

      // If not cached, fetch from API
      const definitions = await this.getBadgeDefinitions();
      
      // Cache for future use
      localStorage.setItem('badgeDefinitions', JSON.stringify(definitions));
      localStorage.setItem('badgeDefinitionsTimestamp', Date.now().toString());
      
      return definitions.find(b => b.id === badgeId) || null;
    } catch (error) {
      console.error('Error getting badge by ID:', error);
      return null;
    }
  }

  // Check if badge definitions cache is stale (older than 1 hour)
  isCacheStale(): boolean {
    const timestamp = localStorage.getItem('badgeDefinitionsTimestamp');
    if (!timestamp) return true;
    
    const age = Date.now() - parseInt(timestamp);
    return age > 60 * 60 * 1000; // 1 hour
  }

  // Refresh badge definitions if cache is stale
  async refreshDefinitionsIfNeeded(): Promise<void> {
    if (this.isCacheStale()) {
      const definitions = await this.getBadgeDefinitions();
      if (definitions.length > 0) {
        localStorage.setItem('badgeDefinitions', JSON.stringify(definitions));
        localStorage.setItem('badgeDefinitionsTimestamp', Date.now().toString());
      }
    }
  }
}

export const badgeService = new BadgeService();