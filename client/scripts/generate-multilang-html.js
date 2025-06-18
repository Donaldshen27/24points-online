import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original index.html
const indexPath = path.join(__dirname, '../index.html');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

// Generate Chinese version
let zhContent = indexContent
  // Update canonical tag
  .replace(
    '<link rel="canonical" href="https://twentyfourpoints.com" />',
    '<link rel="canonical" href="https://twentyfourpoints.com/zh" />'
  )
  // Update lang attribute
  .replace('<html lang="en">', '<html lang="zh">')
  // Update title
  .replace(
    '<title>24 Points Game - Multiplayer Math Card Game | Play Online Free</title>',
    '<title>24点游戏 - 在线多人数学益智游戏 | 免费24points对战</title>'
  )
  // Update meta title
  .replace(
    '<meta name="title" content="24 Points Game - Multiplayer Math Card Game | Play Online Free" />',
    '<meta name="title" content="24点游戏 - 在线多人数学益智游戏 | 免费24points对战" />'
  )
  // Update description
  .replace(
    '<meta name="description" content="Play 24 Points (24points) online! Race against opponents to solve math puzzles using 4 cards. Combine numbers with +, -, ×, ÷ to reach 24. Free 24points multiplayer brain training game." />',
    '<meta name="description" content="在线玩24点游戏(24points)！与对手竞速，用4张牌通过加减乘除凑成24。免费的24points多人数学益智游戏，锻炼大脑计算能力。" />'
  )
  // Update keywords
  .replace(
    '<meta name="keywords" content="24 points game, 24points, 24 points, twentyfour points, math game, card game, multiplayer game, brain training, mental math, puzzle game, educational game, online game, free game" />',
    '<meta name="keywords" content="24点游戏, 24点, 24points, 在线24点, 算24点, 数学游戏, 益智游戏, 多人游戏, 脑力训练, 心算游戏, 教育游戏, 网页游戏, 免费游戏" />'
  )
  // Update language meta
  .replace(
    '<meta name="language" content="English" />',
    '<meta name="language" content="Chinese" />'
  )
  // Update OG URL
  .replace(
    '<meta property="og:url" content="https://twentyfourpoints.com" />',
    '<meta property="og:url" content="https://twentyfourpoints.com/zh" />'
  )
  // Update OG locale
  .replace(
    '<meta property="og:locale" content="en_US" />',
    '<meta property="og:locale" content="zh_CN" />'
  )
  // Update Twitter URL
  .replace(
    '<meta name="twitter:url" content="https://twentyfourpoints.com" />',
    '<meta name="twitter:url" content="https://twentyfourpoints.com/zh" />'
  );

// Write the Chinese version
const zhPath = path.join(__dirname, '../index-zh.html');
fs.writeFileSync(zhPath, zhContent, 'utf-8');

console.log('Generated index-zh.html for Chinese version');