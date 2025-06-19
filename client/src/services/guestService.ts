class GuestService {
  private readonly GUEST_USERNAME_KEY = 'guestUsername';

  getGuestUsername(): string | null {
    try {
      return localStorage.getItem(this.GUEST_USERNAME_KEY);
    } catch (error) {
      console.error('Error reading guest username from localStorage:', error);
      return null;
    }
  }

  setGuestUsername(username: string): void {
    try {
      localStorage.setItem(this.GUEST_USERNAME_KEY, username);
    } catch (error) {
      console.error('Error saving guest username to localStorage:', error);
    }
  }

  clearGuestUsername(): void {
    try {
      localStorage.removeItem(this.GUEST_USERNAME_KEY);
    } catch (error) {
      console.error('Error clearing guest username from localStorage:', error);
    }
  }
}

export const guestService = new GuestService();