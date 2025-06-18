import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChineseSEOContent } from './ChineseSEOContent';
import './SEOContent.css';

export const SEOContent: React.FC = () => {
  const { i18n } = useTranslation();
  
  if (i18n.language === 'zh') {
    return <ChineseSEOContent />;
  }
  
  return (
    <section className="seo-content" aria-label="Game Information">
      <div className="seo-container">
        <h2>Welcome to 24 Points (24points) - The Ultimate Math Card Game</h2>
        
        <div className="seo-section">
          <h3>What is 24 Points (24points)?</h3>
          <p>
            24 Points (also known as 24points) is an exciting multiplayer math card game that challenges your mental arithmetic skills. 
            In this fast-paced 24points game, players race against each other to solve mathematical puzzles by combining four cards to reach exactly 24 
            using addition, subtraction, multiplication, and division.
          </p>
        </div>

        <div className="seo-section">
          <h3>How to Play 24 Points (24points) Online</h3>
          <ol>
            <li><strong>Join a Game Room:</strong> Create or join a multiplayer room with another player</li>
            <li><strong>Get Your Cards:</strong> Each player starts with 20 cards numbered 1-10 (two of each)</li>
            <li><strong>Race to Solve:</strong> Four cards are dealt to the center - find a way to make 24!</li>
            <li><strong>Claim Your Solution:</strong> Hit "I know it!" when you find the answer</li>
            <li><strong>Win the Round:</strong> Correct answers send cards to your opponent</li>
            <li><strong>Victory:</strong> The first player to run out of cards wins!</li>
          </ol>
        </div>

        <div className="seo-section">
          <h3>Why Play 24 Points (24points)?</h3>
          <ul>
            <li><strong>Brain Training:</strong> Improve mental math and problem-solving skills</li>
            <li><strong>Competitive Fun:</strong> Real-time multiplayer gameplay against friends or strangers</li>
            <li><strong>Educational Value:</strong> Perfect for students learning arithmetic operations</li>
            <li><strong>Quick Games:</strong> Each match takes just 5-10 minutes</li>
            <li><strong>Free to Play:</strong> No downloads, no registration required</li>
          </ul>
        </div>

        <div className="seo-section">
          <h3>Game Features</h3>
          <div className="features-grid">
            <div className="feature">
              <h4>🎮 Real-Time Multiplayer</h4>
              <p>Compete against players worldwide in exciting head-to-head matches</p>
            </div>
            <div className="feature">
              <h4>🧮 Smart Validation</h4>
              <p>Every puzzle is guaranteed to have at least one valid solution</p>
            </div>
            <div className="feature">
              <h4>⚡ Fast-Paced Action</h4>
              <p>Quick rounds keep the excitement high and games moving</p>
            </div>
            <div className="feature">
              <h4>📱 Cross-Platform</h4>
              <p>Play on any device - desktop, tablet, or mobile phone</p>
            </div>
          </div>
        </div>

        <div className="seo-section">
          <h3>Strategy Tips for 24 Points (24points)</h3>
          <ul>
            <li><strong>Look for Common Patterns:</strong> 6×4=24, 8×3=24, 12×2=24</li>
            <li><strong>Use All Operations:</strong> Don't forget about subtraction and division</li>
            <li><strong>Think Outside the Box:</strong> Sometimes complex expressions work best</li>
            <li><strong>Practice Speed:</strong> The faster you solve, the more likely you'll win</li>
            <li><strong>Stay Calm:</strong> Don't panic if your opponent claims first</li>
          </ul>
        </div>

        <div className="seo-section">
          <h3>Frequently Asked Questions</h3>
          <dl>
            <dt>Is 24 Points (24points) free to play?</dt>
            <dd>Yes! 24 Points (24points) is completely free to play with no hidden costs or premium features.</dd>
            
            <dt>Do I need to download anything?</dt>
            <dd>No downloads required. Play directly in your web browser on any device.</dd>
            
            <dt>Can I play against friends?</dt>
            <dd>Yes! Create a private room and share the room code with your friend to play together.</dd>
            
            <dt>What if there's no solution?</dt>
            <dd>Our system ensures every puzzle has at least one valid solution. Keep trying!</dd>
            
            <dt>How long does a game take?</dt>
            <dd>Most games finish in 5-10 minutes, perfect for a quick mental workout.</dd>
          </dl>
        </div>

        <div className="seo-section">
          <h3>Join the 24 Points (24points) Community</h3>
          <p>
            Thousands of players worldwide enjoy 24 Points (24points) every day. Whether you're a math enthusiast, 
            a student looking to improve arithmetic skills, or someone who loves competitive puzzle games, 
            24points offers endless entertainment and mental stimulation.
          </p>
          <p className="cta">
            <strong>Ready to test your skills? Start playing 24points now - no registration required!</strong>
          </p>
        </div>
      </div>
    </section>
  );
};