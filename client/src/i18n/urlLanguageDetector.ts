const urlLanguageDetector = {
  name: 'urlLanguageDetector',
  lookup(): string | string[] | undefined {
    // Check if URL starts with /zh
    const path = window.location.pathname;
    if (path.startsWith('/zh')) {
      return 'zh';
    }
    return undefined;
  },
  cacheUserLanguage(lng: string) {
    // Update the URL when language changes
    const currentPath = window.location.pathname;
    const isZhPath = currentPath.startsWith('/zh');
    
    if (lng === 'zh' && !isZhPath) {
      // Add /zh prefix
      const newPath = '/zh' + currentPath;
      window.history.replaceState(null, '', newPath);
    } else if (lng !== 'zh' && isZhPath) {
      // Remove /zh prefix
      const newPath = currentPath.replace(/^\/zh/, '') || '/';
      window.history.replaceState(null, '', newPath);
    }
  }
};

export default urlLanguageDetector;