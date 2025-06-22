# Badge Level System

## Level Calculation Formula
The level system uses a quadratic progression formula:
- **Points needed for level n** = `n × (n + 1) × 50`

This creates an increasing difficulty curve where each level requires more points than the last.

## Level Thresholds
- Level 1: 0 points (starting level)
- Level 2: 100 points
- Level 3: 300 points  
- Level 4: 600 points
- Level 5: 1,000 points
- Level 6: 1,500 points
- Level 7: 2,100 points
- Level 8: 2,800 points
- Level 9: 3,600 points
- Level 10: 4,500 points

## Points to Next Level Calculation
The system calculates:
1. Current level threshold: `level × (level + 1) × 50`
2. Next level threshold: `(level + 1) × (level + 2) × 50`
3. Points to next level: `next_threshold - current_points`

## Issue Fixed
The LevelIndicator component was using a fixed 100 points per level, which didn't match the actual quadratic progression. This caused negative values when:
- Player had 60 points (Level 1)
- Component calculated: Level 2 needs 100 points
- Points to next: 100 - 60 = 40 ✅
- But with the wrong formula it showed: -40 ❌

## Visual Tiers
Levels have visual distinctions:
- Levels 1-4: Common (default)
- Levels 5-14: Uncommon
- Levels 15-29: Rare
- Levels 30-49: Epic
- Levels 50+: Legendary