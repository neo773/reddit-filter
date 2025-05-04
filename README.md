# Reddit Filter Chrome Extension

A Chrome extension that filters Reddit posts based on keywords in post titles or subreddit names.


![image](https://github.com/user-attachments/assets/83e7abb9-336d-4ed9-aa01-fdb4c2425054)

## Features

- Filter Reddit posts containing specific keywords
- Easily add and remove keywords from the filter list
- Block ads
- Real-time filtering as you browse Reddit
- Clean UI with Tailwind CSS

## Development

### Prerequisites

- [Bun.js](https://bun.sh/)

### Setup

1. Clone this repository
2. Install dependencies:
   ```
   bun install
   ```
3. Build the extension:
   ```
   bun run build
   ```
4. For development with hot reloading:
   ```
   bun run watch
   ```

### Loading the extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked" and select the `dist` directory from this project
4. The extension should now be installed and ready to use

## Usage

1. Click on the extension icon in the Chrome toolbar
2. Add keywords you want to filter
3. Click "Save" to apply the filters
4. Browse Reddit and posts containing those keywords will be hidden automatically
