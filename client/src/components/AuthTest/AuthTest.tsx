import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import './AuthTest.css';

export const AuthTest: React.FC = () => {
  const { user, login, register, logout } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Test credentials
  const [credentials, setCredentials] = useState({
    email: 'test@example.com',
    username: 'testuser',
    password: 'Test123!',
    confirmPassword: 'Test123!'
  });

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testRegistration = async () => {
    setIsLoading(true);
    addResult('Starting registration test...');
    
    try {
      await register(
        credentials.username,
        credentials.email,
        credentials.password,
        credentials.confirmPassword
      );
      addResult('✅ Registration successful!');
      addResult(`User registered: ${credentials.username} (${credentials.email})`);
    } catch (error) {
      addResult(`❌ Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    setIsLoading(true);
    addResult('Starting login test...');
    
    try {
      await login(credentials.email, credentials.password);
      addResult('✅ Login successful!');
      addResult(`Logged in as: ${credentials.email}`);
    } catch (error) {
      addResult(`❌ Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectAuthService = async () => {
    setIsLoading(true);
    addResult('Testing direct authService calls...');
    
    try {
      // Test login
      const loginResult = await authService.login({
        email: credentials.email,
        password: credentials.password
      });
      addResult(`✅ Direct login successful: ${JSON.stringify(loginResult.user)}`);
      
      // Test get current user
      const currentUser = await authService.getCurrentUser();
      addResult(`✅ Current user: ${JSON.stringify(currentUser)}`);
      
      // Check tokens
      const token = authService.getAccessToken();
      addResult(`✅ Access token exists: ${!!token}`);
      
    } catch (error) {
      addResult(`❌ Direct auth service test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLogout = async () => {
    setIsLoading(true);
    addResult('Starting logout test...');
    
    try {
      await logout();
      addResult('✅ Logout successful!');
    } catch (error) {
      addResult(`❌ Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthState = () => {
    addResult('--- Current Auth State ---');
    addResult(`User from context: ${user ? JSON.stringify(user) : 'null'}`);
    addResult(`Is authenticated (authService): ${authService.isAuthenticated()}`);
    addResult(`Access token exists: ${!!authService.getAccessToken()}`);
    addResult(`LocalStorage accessToken: ${!!localStorage.getItem('accessToken')}`);
    addResult(`LocalStorage user: ${localStorage.getItem('user') || 'null'}`);
  };

  const checkBackendConnection = async () => {
    setIsLoading(true);
    addResult('Testing backend connection...');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3024'}/api/auth/me`, {
        headers: authService.getAccessToken() ? {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        addResult(`✅ Backend connection successful: ${JSON.stringify(data)}`);
      } else {
        addResult(`❌ Backend returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      addResult(`❌ Backend connection failed: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-test-container">
      <h1>Authentication Test Page</h1>
      
      <div className="auth-test-section">
        <h2>Current Auth State</h2>
        <div className="auth-state">
          <p><strong>User:</strong> {user ? `${user.username} (${user.email})` : 'Not logged in'}</p>
          <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
          <p><strong>Role:</strong> {user?.role || 'N/A'}</p>
        </div>
      </div>

      <div className="auth-test-section">
        <h2>Test Credentials</h2>
        <div className="test-credentials">
          <input
            type="text"
            placeholder="Username"
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
          />
          <input
            type="email"
            placeholder="Email"
            value={credentials.email}
            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
          />
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={credentials.confirmPassword}
            onChange={(e) => setCredentials({...credentials, confirmPassword: e.target.value})}
          />
        </div>
      </div>

      <div className="auth-test-section">
        <h2>Test Actions</h2>
        <div className="test-actions">
          <button onClick={testRegistration} disabled={isLoading}>Test Registration</button>
          <button onClick={testLogin} disabled={isLoading}>Test Login</button>
          <button onClick={testDirectAuthService} disabled={isLoading}>Test Direct Auth Service</button>
          <button onClick={testLogout} disabled={isLoading}>Test Logout</button>
          <button onClick={checkAuthState} disabled={isLoading}>Check Auth State</button>
          <button onClick={checkBackendConnection} disabled={isLoading}>Check Backend</button>
          <button onClick={clearResults} className="clear-btn">Clear Results</button>
        </div>
      </div>

      <div className="auth-test-section">
        <h2>Test Results</h2>
        <div className="test-results">
          {testResults.length === 0 ? (
            <p>No test results yet. Click a test button to start.</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="test-result">{result}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};