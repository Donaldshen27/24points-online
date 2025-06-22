# Room Link Sharing Feature - HIGH PRIORITY

## Overview
Implement a viral room sharing system that allows players to generate shareable links for game rooms. This feature is **critical for growth** as it enables organic user acquisition through social sharing and reduces friction for new players to join games.

## Business Impact
- **Viral Growth**: Each shared link can bring 1-3 new players
- **Reduced Friction**: No account needed to join via link
- **Social Proof**: Friends inviting friends builds trust
- **Quick Onboarding**: From link click to playing in <10 seconds
- **Network Effects**: More players → more games → more sharing

## Core Features

### 1. Link Generation
- **One-click generation** from any game room
- **Short, memorable URLs**: `twentyfourpoints.com/room/ABC123`
- **Custom aliases** (premium): `twentyfourpoints.com/room/johns-game`
- **Instant copy** to clipboard with visual feedback

### 2. Sharing Options
```typescript
interface ShareOptions {
  copyLink: () => void;           // One-click copy
  shareViaAPI: () => void;        // Native mobile share
  whatsApp: () => void;           // Direct WhatsApp share
  telegram: () => void;           // Telegram integration
  discord: () => void;            // Discord rich embed
  twitter: () => void;            // Pre-composed tweet
  qrCode: () => void;             // QR for in-person
  email: () => void;              // Email invitation
}
```

### 3. Join Flow
1. Click shared link
2. Land on branded join page
3. Enter nickname (if not logged in)
4. Auto-join room
5. Start playing immediately

## Technical Architecture

### URL Structure
```
Base URL: twentyfourpoints.com/room/{roomCode}
Advanced: twentyfourpoints.com/room/{roomCode}?ref={source}&campaign={name}

Examples:
- twentyfourpoints.com/room/ABC123
- twentyfourpoints.com/room/fun-game-night
- twentyfourpoints.com/room/XYZ789?ref=whatsapp
```

### Backend Implementation

#### 1. Room Link Service
```typescript
class RoomLinkService {
  // Generate shareable link
  generateRoomLink(roomId: string): RoomLink {
    const code = this.generateShortCode(); // 6 chars, alphanumeric
    const link = {
      id: uuid(),
      roomId,
      code,
      url: `${BASE_URL}/room/${code}`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      clickCount: 0,
      maxJoins: 10, // Prevent abuse
    };
    
    return this.saveToDB(link);
  }

  // Validate and resolve link
  async resolveRoomLink(code: string): Promise<Room | null> {
    const link = await this.findByCode(code);
    
    if (!link || link.expiresAt < new Date()) {
      return null;
    }
    
    if (link.clickCount >= link.maxJoins) {
      throw new Error('Room is full via this link');
    }
    
    await this.incrementClickCount(link.id);
    return this.roomService.findById(link.roomId);
  }
}
```

#### 2. Database Schema
```sql
-- Room links table
room_links (
  id: UUID PRIMARY KEY,
  room_id: VARCHAR(50) REFERENCES rooms(id),
  code: VARCHAR(20) UNIQUE NOT NULL,
  custom_alias: VARCHAR(50) UNIQUE, -- Premium feature
  created_by: UUID REFERENCES users(id),
  created_at: TIMESTAMP DEFAULT NOW(),
  expires_at: TIMESTAMP,
  click_count: INTEGER DEFAULT 0,
  join_count: INTEGER DEFAULT 0,
  max_joins: INTEGER DEFAULT 10,
  is_active: BOOLEAN DEFAULT true
)

-- Link analytics
link_analytics (
  id: UUID PRIMARY KEY,
  link_id: UUID REFERENCES room_links(id),
  clicked_at: TIMESTAMP DEFAULT NOW(),
  ip_address: INET,
  user_agent: TEXT,
  referrer: VARCHAR(50), -- whatsapp, telegram, direct, etc
  country: VARCHAR(2),
  joined_room: BOOLEAN DEFAULT false,
  user_id: UUID REFERENCES users(id) -- if they signed up
)

-- Share tracking
share_events (
  id: UUID PRIMARY KEY,
  room_id: VARCHAR(50),
  user_id: UUID REFERENCES users(id),
  share_method: VARCHAR(20), -- copy, whatsapp, telegram, etc
  shared_at: TIMESTAMP DEFAULT NOW()
)
```

#### 3. API Endpoints
```typescript
// Room link endpoints
POST   /api/rooms/:roomId/share-link     // Generate shareable link
GET    /api/links/:code                   // Resolve link to room
POST   /api/links/:code/join              // Join room via link
GET    /api/links/:code/preview           // Get room preview (for embeds)
POST   /api/links/:code/analytics        // Track link click

// Analytics endpoints  
GET    /api/analytics/links/:linkId       // Link performance
GET    /api/analytics/viral-coefficient   // Viral growth metrics
```

### Frontend Implementation

#### 1. Share Button Component
```tsx
const ShareRoomButton: React.FC<{ roomId: string }> = ({ roomId }) => {
  const [showModal, setShowModal] = useState(false);
  const [link, setLink] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    const response = await api.generateRoomLink(roomId);
    setLink(response.url);
    setShowModal(true);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    trackEvent('link_copied', { roomId });
    
    // Visual feedback
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVia = (platform: string) => {
    const text = `Join me for a game of 24 Points! 🎯`;
    
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`,
      telegram: `https://t.me/share/url?url=${link}&text=${encodeURIComponent(text)}`,
      discord: `https://discord.com/channels/@me?message=${encodeURIComponent(text + ' ' + link)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${link}`,
    };

    window.open(shareUrls[platform], '_blank');
    trackEvent('link_shared', { roomId, platform });
  };

  return (
    <>
      <Button onClick={generateLink} icon={<ShareIcon />}>
        Invite Friends
      </Button>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="share-modal">
          <h2>Invite Friends to Play!</h2>
          
          <div className="link-display">
            <input value={link} readOnly />
            <Button onClick={copyLink}>
              {copied ? '✓ Copied!' : 'Copy'}
            </Button>
          </div>

          <div className="share-buttons">
            <ShareButton 
              platform="whatsapp" 
              onClick={() => shareVia('whatsapp')}
            />
            <ShareButton 
              platform="telegram" 
              onClick={() => shareVia('telegram')}
            />
            <ShareButton 
              platform="discord" 
              onClick={() => shareVia('discord')}
            />
            <ShareButton 
              platform="twitter" 
              onClick={() => shareVia('twitter')}
            />
          </div>

          <QRCode value={link} size={200} />
          
          <p className="expire-note">
            Link expires in 24 hours • Max 10 joins
          </p>
        </div>
      </Modal>
    </>
  );
};
```

#### 2. Join via Link Page
```tsx
const JoinRoomPage: React.FC = () => {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    validateAndJoinRoom();
  }, [code]);

  const validateAndJoinRoom = async () => {
    try {
      // Track link click
      await api.trackLinkClick(code);
      
      // Resolve room
      const roomData = await api.resolveRoomLink(code);
      
      if (!roomData) {
        setError('This link has expired or is invalid');
        return;
      }

      setRoom(roomData);
      
      // Auto-join if logged in
      if (isAuthenticated()) {
        await joinRoom(roomData.id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Finding your game..." />;
  }

  if (error) {
    return (
      <ErrorPage 
        message={error}
        action={
          <Button onClick={() => navigate('/')}>
            Create New Game
          </Button>
        }
      />
    );
  }

  return (
    <div className="join-room-page">
      <div className="game-preview">
        <h1>You're invited to play 24 Points!</h1>
        <RoomPreview room={room} />
        
        {!isAuthenticated() ? (
          <QuickJoinForm 
            onSubmit={(nickname) => joinAsGuest(room.id, nickname)}
          />
        ) : (
          <Button onClick={() => joinRoom(room.id)} size="large">
            Join Game
          </Button>
        )}
      </div>
    </div>
  );
};
```

#### 3. Rich Link Previews
```html
<!-- Dynamic meta tags for link previews -->
<meta property="og:title" content="Join my 24 Points game!" />
<meta property="og:description" content="Click to join and play 24 Points - the competitive math puzzle game" />
<meta property="og:image" content="https://twentyfourpoints.com/preview/room-invite.png" />
<meta property="og:url" content="https://twentyfourpoints.com/room/ABC123" />
<meta name="twitter:card" content="summary_large_image" />
```

### Viral Mechanics

#### 1. Incentivize Sharing
- **Sharer Rewards**: +10 XP for each friend who joins
- **Joiner Rewards**: +5 XP for joining via link
- **Streak Bonus**: Extra rewards for consecutive days of sharing
- **Referral Tracking**: See who joined via your links

#### 2. Reduce Join Friction
- **No Account Required**: Play as guest immediately
- **Persistent Guest Progress**: Save progress if they sign up later
- **Smart Onboarding**: Tutorial only for first-time players
- **Quick Room Entry**: < 3 seconds from click to game

#### 3. Social Proof
- **Player Count**: "3 friends already in this room"
- **Activity Indicator**: "2 players currently playing"
- **Recent Joins**: "Sarah just joined!"
- **Win Notifications**: "John just won a round!"

### Analytics & Metrics

#### Key Metrics to Track
```typescript
interface ViralMetrics {
  linkGenerationRate: number;      // Links created per DAU
  linkClickRate: number;           // Clicks per link shared
  linkJoinRate: number;            // Joins per link click
  viralCoefficient: number;        // New users per existing user
  shareMethodBreakdown: {          // Which platforms work best
    whatsapp: number;
    telegram: number;
    discord: number;
    copyLink: number;
  };
  retentionBySource: {             // D1/D7/D30 by acquisition source
    organic: number;
    sharedLink: number;
    direct: number;
  };
}
```

#### Analytics Dashboard
- Real-time link performance
- Viral coefficient trends
- Geographic distribution
- Peak sharing times
- Most successful share methods

### Security Considerations

1. **Rate Limiting**
   - Max 10 links per room per hour
   - Max 100 joins per link
   - IP-based rate limiting

2. **Abuse Prevention**
   - Expire links after 24 hours
   - Require CAPTCHA for suspicious activity
   - Block spam domains in custom aliases

3. **Privacy**
   - Don't expose player names in preview
   - Optional private rooms (link-only access)
   - GDPR-compliant analytics

### Mobile Optimization

1. **Native Share Sheet**
   ```typescript
   if (navigator.share) {
     await navigator.share({
       title: 'Join my 24 Points game!',
       text: 'Let\'s play together',
       url: link
     });
   }
   ```

2. **Deep Linking**
   - Support for app deep links (future)
   - Fallback to web version
   - Smart app banners

3. **Touch-Friendly UI**
   - Large tap targets
   - Swipe to reveal share options
   - Haptic feedback on copy

## Implementation Priority

### Phase 1: Core Functionality (Days 1-2)
- [x] Basic link generation
- [x] Copy to clipboard
- [x] Join via link flow
- [x] Room validation

### Phase 2: Social Sharing (Days 3-4)
- [ ] WhatsApp/Telegram integration
- [ ] Discord/Twitter sharing
- [ ] QR code generation
- [ ] Share tracking

### Phase 3: Analytics & Optimization (Days 5-6)
- [ ] Analytics implementation
- [ ] A/B testing framework
- [ ] Performance optimization
- [ ] Security hardening

## Success Criteria
1. **Viral Coefficient > 0.5** within first month
2. **30% of new users** come from shared links
3. **Link CTR > 40%** (clicks/shares)
4. **Join conversion > 60%** (joins/clicks)
5. **< 3 second** join time from link click

## ROI Projections
- **Week 1**: 100 shares → 150 new users
- **Month 1**: 2,000 shares → 3,000 new users  
- **Month 3**: 20,000 shares → 30,000 new users
- **CAC Reduction**: 80% lower than paid acquisition

This feature is **mission-critical** for growth and should be implemented immediately after core game functionality is stable.