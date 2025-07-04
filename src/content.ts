import { type FilterStorage } from "./types/types";

interface RedditPost extends HTMLElement {
  postTitle: string;
  subredditName: string;
  recommendationSource?: string;
}

// Function to check if a post should be hidden
const shouldHidePost = (post: RedditPost, settings: FilterStorage): boolean => {
  // Get attributes directly 
  const postTitle = post.getAttribute('post-title') || '';
  const subredditName = post.getAttribute('subreddit-name') || '';
  const recommendationSource = post.getAttribute('recommendation-source') || '';
  
  // Check if post should be hidden due to geo popular content setting
  if (
    settings.hideGeoPopular &&
    (recommendationSource === 'GeoPopularRecommendationContext' ||
     recommendationSource === 'geo_explore_subreddits')
  ) {
    return true;
  }
  // Check if post should be hidden due to keywords - use word boundary matching
  const postTitleLower = postTitle.toLowerCase();
  const subredditNameLower = subredditName.toLowerCase();
  
  // Helper function to check if a keyword matches as a whole word
  const keywordMatches = (text: string, keyword: string): boolean => {
    // Escape special regex characters in the keyword
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Create regex with word boundaries to match whole words only
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
    return regex.test(text);
  };

  // Helper function to split camelCase/PascalCase subreddit names into words
  const splitSubredditName = (subreddit: string): string[] => {
    // Remove r/ prefix if it exists
    const cleanSubreddit = subreddit.replace(/^r\//, '');
    
    // Split by capital letters to get individual words
    // This regex finds positions before capital letters (except at the start)
    const words = cleanSubreddit.split(/(?=[A-Z])/).filter(word => word.length > 0);
    
    return words.map(word => word.toLowerCase());
  };

  // Check title against keywords
  const titleMatches = settings.keywords.some(keyword => 
    keywordMatches(postTitleLower, keyword)
  );

  // Check subreddit name - split into words first, then check each word
  const subredditWords = splitSubredditName(subredditName);
  const subredditMatches = settings.keywords.some(keyword => 
    subredditWords.some(word => keywordMatches(word, keyword)) ||
    keywordMatches(subredditNameLower, keyword) // Also check the full name for backwards compatibility
  );

  const shouldHide = titleMatches || subredditMatches;

  if (shouldHide) {
    const matchedKeywords = settings.keywords.filter(keyword => 
      keywordMatches(postTitleLower, keyword) || 
      subredditWords.some(word => keywordMatches(word, keyword)) ||
      keywordMatches(subredditNameLower, keyword)
    );
    console.log('Hiding post because of matching keywords:', matchedKeywords);
    console.log('Subreddit words:', subredditWords);
  }

  return shouldHide;
};

// Function to hide ads if enabled
const hideAds = (settings: FilterStorage): void => {
  if (settings.hideAds) {
    const ads = document.querySelectorAll('shreddit-ad-post');
    ads.forEach(ad => {
      (ad as HTMLElement).style.display = 'none';
    });
  }
};

// Function to process posts and hide them if needed
const processRedditPosts = (settings: FilterStorage): void => {
  const posts = document.querySelectorAll('shreddit-post') as NodeListOf<RedditPost>;
  
  posts.forEach(post => {
    if (shouldHidePost(post, settings)) {
      post.style.display = 'none';
    } else {
      // Make sure posts that no longer match filter criteria are visible
      post.style.display = '';
    }
  });
  
  // Also process ads
  hideAds(settings);
};

// Main function to load settings and setup observers
const initRedditFilter = async (): Promise<void> => {
  // Load settings from storage
  const data = await chrome.storage.sync.get('redditFilter') as { redditFilter?: FilterStorage };
  const settings: FilterStorage = {
    keywords: data.redditFilter?.keywords || [],
    hideGeoPopular: data.redditFilter?.hideGeoPopular || false,
    hideAds: data.redditFilter?.hideAds || false
  };
  
  // Process existing posts
  processRedditPosts(settings);
  
  // Set up mutation observer to handle dynamically loaded posts
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node instanceof HTMLElement && 
              (node.tagName === 'SHREDDIT-POST' || 
               node.tagName === 'SHREDDIT-AD-POST' || 
               node.querySelector('shreddit-post') || 
               node.querySelector('shreddit-ad-post'))) {
            shouldProcess = true;
            break;
          }
        }
      }
      
      if (shouldProcess) break;
    }
    
    if (shouldProcess) {
      processRedditPosts(settings);
    }
  });
  
  // Start observing the document
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Listen for storage changes to update filters in real-time
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.redditFilter && changes.redditFilter.newValue) {
      const newSettings = changes.redditFilter.newValue as FilterStorage;
      settings.keywords = newSettings.keywords || [];
      settings.hideGeoPopular = newSettings.hideGeoPopular || false;
      settings.hideAds = newSettings.hideAds || false;
      processRedditPosts(settings);
    }
  });
};

// Initialize when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRedditFilter);
} else {
  initRedditFilter();
} 