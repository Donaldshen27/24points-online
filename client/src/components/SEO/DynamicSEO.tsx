import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function DynamicSEO() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  useEffect(() => {
    // Update meta tags based on language
    const updateMetaTag = (selector: string, content: string) => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', content);
      }
    };

    const updatePropertyTag = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    if (isZh) {
      // Update Chinese meta tags
      document.title = '24点游戏 - 在线24点竞技场 | 免费多人数学游戏';
      updateMetaTag('meta[name="title"]', '24点游戏 - 在线24点竞技场 | 免费多人数学游戏');
      updateMetaTag('meta[name="description"]', '在线24点游戏，与对手竞速解题！使用4张牌通过加减乘除得到24。免费的在线24点多人对战游戏，锻炼数学思维，提升计算能力。');
      updateMetaTag('meta[name="keywords"]', '24点, 在线24点, 24点游戏, 二十四点, 24點, 数学游戏, 益智游戏, 多人游戏, 脑力训练, 心算游戏, 扑克牌游戏');
      updatePropertyTag('og:title', '24点游戏 - 在线24点竞技场');
      updatePropertyTag('og:description', '在线24点多人对战！使用4张牌通过数学运算得到24，与朋友实时竞技，锻炼大脑思维。');
      updateMetaTag('meta[name="twitter:title"]', '24点游戏 - 在线24点竞技场');
      updateMetaTag('meta[name="twitter:description"]', '在线24点多人对战！使用4张牌通过数学运算得到24。');
      updateMetaTag('meta[name="language"]', 'Chinese');
      document.documentElement.lang = 'zh';
    } else {
      // Update English meta tags with 24points variations
      document.title = '24 Points Game - 24points Multiplayer Math Card Game | Play Online Free';
      updateMetaTag('meta[name="title"]', '24 Points Game - 24points Multiplayer Math Card Game | Play Online Free');
      updateMetaTag('meta[name="description"]', 'Play 24 Points (24points) online! Race against opponents to solve math puzzles using 4 cards. Combine numbers with +, -, ×, ÷ to reach 24. Free 24points multiplayer brain training game.');
      updateMetaTag('meta[name="keywords"]', '24 points game, 24points, 24 points, twentyfour points, math game, card game, multiplayer game, brain training, mental math, puzzle game, educational game, online game, free game');
      updatePropertyTag('og:title', '24 Points Game - 24points Multiplayer Math Card Game');
      updatePropertyTag('og:description', 'Challenge friends in 24points real-time! Solve math puzzles by combining 4 cards to reach exactly 24. Train your brain with this addictive multiplayer game.');
      updateMetaTag('meta[name="twitter:title"]', '24 Points Game - 24points Multiplayer Math Card Game');
      updateMetaTag('meta[name="twitter:description"]', 'Challenge friends in 24points real-time! Solve math puzzles by combining 4 cards to reach exactly 24.');
      updateMetaTag('meta[name="language"]', 'English');
      document.documentElement.lang = 'en';
    }
  }, [isZh]);

  return null;
}