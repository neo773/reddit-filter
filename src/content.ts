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
  if (settings.hideGeoPopular && recommendationSource === 'GeoPopularRecommendationContext') {
    return true;
  }
  
  // Check if post should be hidden due to keywords - convert all to lowercase for comparison
  const postTitleLower = postTitle.toLowerCase();
  const subredditNameLower = subredditName.toLowerCase();
  
  return settings.keywords.some(keyword => 
    postTitleLower.includes(keyword) || subredditNameLower.includes(keyword)
  );
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
    if (changes.redditFilter) {
      const newSettings = changes.redditFilter.newValue || { keywords: [], hideGeoPopular: false, hideAds: false };
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