# Puzzle Records Page

## Overview
A dedicated page in the 24 Points game that displays all puzzle combinations that have been encountered, with sorting options and detailed statistics including best solve times and final solutions.

## Features

### Visual Display
- **Grid Layout**: Displays up to 20 most common puzzles in a responsive grid
- **Ranking**: Each puzzle shows its rank (#1, #2, etc.) based on occurrence count
- **Card Visualization**: Each card is color-coded:
  - Green (1-3): Low numbers
  - Blue (4-6): Medium numbers
  - Orange (7-9): High numbers
  - Red (10): Highest number
- **Occurrence Count**: Shows how many times each puzzle has appeared

### Interactive Elements
- **Hover Effect**: Hover over any puzzle to see:
  - Trophy icon 🏆
  - Record holder's username
  - Best solve time in seconds
- **Tooltips**: Elegant tooltip appears above the puzzle on hover
- **Animations**: Smooth fade-in animations and hover transitions

### Data Updates
- **Real-time Updates**: Data refreshes every 5 seconds
- **Live Statistics**: See new records as they're set during gameplay

## How to Access
Click the "Puzzles" button (🧩) in the main navigation bar

## Use Cases
- **Game Analytics**: See which puzzles appear most frequently
- **Competitive Analysis**: Study which puzzles have the fastest/slowest records
- **Testing**: Verify puzzle tracking is working correctly
- **Player Insights**: Understand which combinations are most challenging

## Technical Details
- Fetches data via Socket.io event: `get-puzzle-records`
- Only displays 4-card combinations
- Sorted by occurrence count (most common first)
- Limited to top 20 puzzles for performance

## Example Display
```
#1  [1][5][5][5]     🏆 john123
    47 times         3.2s

#2  [2][3][4][6]     🏆 speedking
    156 times        2.1s

#3  [3][3][8][8]     🏆 alice99
    23 times         5.6s
```