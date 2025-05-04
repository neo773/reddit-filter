import { type FilterStorage } from './types/types';
import './styles.css';

document.addEventListener('DOMContentLoaded', async () => {
  const addKeywordButton = document.getElementById('add-keyword') as HTMLButtonElement;
  const keywordInput = document.getElementById('keyword-input') as HTMLInputElement;
  const keywordsList = document.getElementById('keywords-list') as HTMLDivElement;
  const saveButton = document.getElementById('save-btn') as HTMLButtonElement;
  const clearButton = document.getElementById('clear-btn') as HTMLButtonElement;
  const geoPopularToggle = document.getElementById('geo-popular-toggle') as HTMLInputElement;
  const adsToggle = document.getElementById('ads-toggle') as HTMLInputElement;
  
  // Current filter settings in memory
  let keywords: string[] = [];
  let hideGeoPopular: boolean = false;
  let hideAds: boolean = false;
  
  // Load saved settings
  const loadSettings = async (): Promise<void> => {
    const data = await chrome.storage.sync.get('redditFilter') as { redditFilter?: FilterStorage };
    keywords = data.redditFilter?.keywords || [];
    hideGeoPopular = data.redditFilter?.hideGeoPopular || false;
    hideAds = data.redditFilter?.hideAds || false;
    
    // Update UI
    renderKeywords();
    geoPopularToggle.checked = hideGeoPopular;
    adsToggle.checked = hideAds;
  };
  
  // Render keywords to the UI
  const renderKeywords = (): void => {
    keywordsList.innerHTML = '';
    keywords.forEach((keyword) => {
      const keywordElement = document.createElement('div');
      keywordElement.className = 'bg-reddit-tag px-2 py-1 rounded-md flex items-center gap-1';
      
      const keywordText = document.createElement('span');
      keywordText.textContent = keyword;
      keywordText.className = 'text-sm text-gray-200';
      
      const removeButton = document.createElement('button');
      removeButton.innerHTML = '&times;';
      removeButton.className = 'text-gray-400 hover:text-reddit-primary font-bold transition-colors';
      removeButton.addEventListener('click', () => {
        keywords = keywords.filter(k => k !== keyword);
        renderKeywords();
      });
      
      keywordElement.appendChild(keywordText);
      keywordElement.appendChild(removeButton);
      keywordsList.appendChild(keywordElement);
    });
  };
  
  // Add keywords - supports both single keywords and comma-delimited lists
  const addKeyword = (): void => {
    const input = keywordInput.value.trim();
    if (!input) return;
    
    // Split by commas and process each keyword
    const newKeywords = input.split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k && !keywords.includes(k));
      
    if (newKeywords.length > 0) {
      keywords = [...keywords, ...newKeywords];
      keywordInput.value = '';
      renderKeywords();
    }
  };
  
  // Save settings to Chrome storage
  const saveSettings = async (): Promise<void> => {
    await chrome.storage.sync.set({
      redditFilter: { 
        keywords,
        hideGeoPopular,
        hideAds
      }
    });
    
    // Visual feedback for save
    saveButton.textContent = 'Saved!';
    saveButton.classList.add('bg-green-600');
    saveButton.classList.remove('bg-reddit-primary', 'hover:bg-reddit-primaryHover');
    
    setTimeout(() => {
      saveButton.textContent = 'Save';
      saveButton.classList.remove('bg-green-600');
      saveButton.classList.add('bg-reddit-primary', 'hover:bg-reddit-primaryHover');
    }, 1500);
  };
  
  // Clear all keywords
  const clearKeywords = (): void => {
    keywords = [];
    renderKeywords();
  };
  
  // Update geoPopular setting
  const updateGeoPopularSetting = (): void => {
    hideGeoPopular = geoPopularToggle.checked;
  };
  
  // Update ads setting
  const updateAdsSetting = (): void => {
    hideAds = adsToggle.checked;
  };
  
  // Event listeners
  addKeywordButton.addEventListener('click', addKeyword);
  keywordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addKeyword();
  });
  saveButton.addEventListener('click', saveSettings);
  clearButton.addEventListener('click', clearKeywords);
  geoPopularToggle.addEventListener('change', updateGeoPopularSetting);
  adsToggle.addEventListener('change', updateAdsSetting);
  
  // Initial load
  await loadSettings();
}); 