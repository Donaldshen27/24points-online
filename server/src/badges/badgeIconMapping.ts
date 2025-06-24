// Badge icon mapping - maps badge IDs to their emoji icons
export const BADGE_ICONS: Record<string, string> = {
  // Skill-based badges
  'speed_demon_bronze': '⚡',
  'speed_demon_silver': '⚡',
  'speed_demon_gold': '⚡',
  'speed_demon_platinum': '⚡',
  'speed_demon_diamond': '⚡',
  'lightning_reflexes_bronze': '🏃',
  'lightning_reflexes_silver': '🏃',
  'lightning_reflexes_gold': '🏃',
  'lightning_reflexes_platinum': '🏃',
  'lightning_reflexes_diamond': '🏃',
  'flawless_victory': '💯',
  
  // Progression badges
  'veteran_bronze': '🎖️',
  'veteran_silver': '🎖️',
  'veteran_gold': '🎖️',
  'veteran_platinum': '🎖️',
  'veteran_diamond': '🎖️',
  'champion_bronze': '🏆',
  'champion_silver': '🏆',
  'champion_gold': '🏆',
  'champion_platinum': '🏆',
  'champion_diamond': '🏆',
  'streaker_bronze': '🔥',
  'streaker_silver': '🔥',
  'streaker_gold': '🔥',
  'streaker_platinum': '🔥',
  'perfect_player_bronze': '✨',
  'perfect_player_silver': '✨',
  'perfect_player_gold': '✨',
  'perfect_player_platinum': '✨',
  
  // Game mode badges
  'classic_master': '🎯',
  'super_mode_expert': '💪',
  'extended_range_expert': '🌟',
  'solo_practice_guru': '🧘',
  'mode_explorer': '🗺️',
  
  // Social & Community badges
  'friendly_rival': '🤝',
  'spectator_sport': '👀',
  'record_breaker_bronze': '📊',
  'record_breaker_silver': '📊',
  'record_breaker_gold': '📊',
  'record_breaker_platinum': '📊',
  'community_contributor': '💬',
  
  // Time-based badges
  'weekend_warrior': '🌅',
  'night_owl': '🦉',
  'early_bird': '🌄',
  'dedicated_player_bronze': '📅',
  'dedicated_player_silver': '📅',
  'dedicated_player_gold': '📅',
  'dedicated_player_platinum': '📅',
  'dedicated_player_diamond': '📅',
  
  // Unique & Special badges
  'comeback_kid': '🔄',
  'underdog_spirit': '🐕',
  'mathematical_genius': '🧮',
  'minimalist': '➖',
  'international_player': '🌍',
  
  // Seasonal/Event badges
  'launch_week_pioneer': '🚀',
  'beta_tester': '🧪'
};

// Default icon for badges without specific icons
export const DEFAULT_BADGE_ICON = '🏆';

// Helper function to get badge icon
export function getBadgeIcon(badgeId: string): string {
  return BADGE_ICONS[badgeId] || DEFAULT_BADGE_ICON;
}