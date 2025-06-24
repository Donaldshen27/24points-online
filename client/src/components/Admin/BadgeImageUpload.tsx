import React, { useState, useEffect } from 'react';
import './BadgeImageUpload.css';

interface Badge {
  id: string;
  name: string;
  category: string;
  icon: string;
  icon_url: string | null;
  hasCustomImage: boolean;
}

export const BadgeImageUpload: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setMessage('Please sign in to access badge administration');
        return;
      }
      
      const response = await fetch('/api/badges/admin/upload-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBadges(data.badges);
        setMessage('');
      } else {
        const errorText = await response.text();
        console.error('Badge fetch error:', response.status, errorText);
        
        if (response.status === 401) {
          setMessage('Authentication required. Please sign in.');
        } else if (response.status === 403) {
          setMessage('Your session has expired. Please sign in again.');
        } else {
          setMessage(`Failed to fetch badges: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
      setMessage('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedBadge || !selectedFile) {
      setMessage('Please select a badge and an image file');
      return;
    }

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/badges/upload/${selectedBadge}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Image uploaded successfully!');
        fetchBadges(); // Refresh the list
        setSelectedFile(null);
        setSelectedBadge('');
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setMessage(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const filteredBadges = badges.filter(badge => {
    if (filter === 'all') return true;
    if (filter === 'with-image') return badge.hasCustomImage;
    if (filter === 'no-image') return !badge.hasCustomImage;
    return badge.category === filter;
  });

  const categories = [...new Set(badges.map(b => b.category))];

  if (loading) {
    return (
      <div className="badge-image-upload">
        <h2>Badge Image Upload Manager</h2>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="badge-image-upload">
      <h2>Badge Image Upload Manager</h2>
      
      {message && (
        <div className={`message ${message.includes('success') ? 'success' : message.includes('sign in') || message.includes('expired') ? 'warning' : 'error'}`}>
          {message}
          {(message.includes('sign in') || message.includes('expired')) && (
            <div style={{ marginTop: '10px' }}>
              <a href="/" style={{ color: 'white', textDecoration: 'underline' }}>
                Go to main page to sign in
              </a>
            </div>
          )}
        </div>
      )}
      
      <div className="upload-section">
        <div className="badge-selector">
          <label htmlFor="badge-select">Select Badge:</label>
          <select 
            id="badge-select"
            value={selectedBadge} 
            onChange={(e) => setSelectedBadge(e.target.value)}
            disabled={uploading}
          >
            <option value="">-- Select a badge --</option>
            {badges.map(badge => (
              <option key={badge.id} value={badge.id}>
                {badge.name} ({badge.category}) {badge.hasCustomImage ? '✓' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="file-selector">
          <label htmlFor="file-input">Choose Image:</label>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </div>

        <button 
          onClick={handleUpload} 
          disabled={uploading || !selectedBadge || !selectedFile}
          className="upload-button"
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>

        {!message && uploading && (
          <div className="message info">
            Uploading...
          </div>
        )}
      </div>

      <div className="badge-list-section">
        <h3>Badge Overview</h3>
        
        <div className="filter-controls">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({badges.length})
          </button>
          <button 
            className={filter === 'with-image' ? 'active' : ''}
            onClick={() => setFilter('with-image')}
          >
            With Image ({badges.filter(b => b.hasCustomImage).length})
          </button>
          <button 
            className={filter === 'no-image' ? 'active' : ''}
            onClick={() => setFilter('no-image')}
          >
            No Image ({badges.filter(b => !b.hasCustomImage).length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={filter === cat ? 'active' : ''}
              onClick={() => setFilter(cat)}
            >
              {cat} ({badges.filter(b => b.category === cat).length})
            </button>
          ))}
        </div>

        <div className="badge-grid">
          {filteredBadges.map(badge => (
            <div key={badge.id} className="badge-item">
              <div className="badge-icon">
                {badge.hasCustomImage && badge.icon_url ? (
                  <img src={badge.icon_url} alt={badge.name} />
                ) : (
                  <span className="default-icon">{badge.icon}</span>
                )}
              </div>
              <div className="badge-info">
                <div className="badge-name">{badge.name}</div>
                <div className="badge-category">{badge.category}</div>
                <div className={`badge-status ${badge.hasCustomImage ? 'has-image' : 'no-image'}`}>
                  {badge.hasCustomImage ? 'Custom Image' : 'Default Icon'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};