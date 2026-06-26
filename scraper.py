import os
import re
import json
import time
import requests
from urllib.parse import urljoin, urlparse

try:
    from playwright.sync_api import sync_playwright
    from bs4 import BeautifulSoup
except ImportError:
    print("Please install playwright and beautifulsoup4: pip install playwright beautifulsoup4")
    print("Then run: playwright install")
    exit(1)

# Configuration
BASE_URL = "https://www.evanswopedigital.com"
PAGES = ["/", "/evan", "/resume"]
OUTPUT_DIR = "scraped_data"
IMAGE_DIR = os.path.join(OUTPUT_DIR, "images")

os.makedirs(IMAGE_DIR, exist_ok=True)

def clean_filename(url):
    # Extracts the file name from Wix URL and cleans it
    # Wix URLs look like: https://static.wixstatic.com/media/d33d07_3e6a5b26...mv2.png/v1/fill/w_192,h_192...
    parsed = urlparse(url)
    path = parsed.path
    # Wix images usually have the filename in the segment after /media/
    match = re.search(r'/media/([^/]+)', url)
    if match:
        filename = match.group(1)
        # Unquote if needed
        filename = filename.replace("%7E", "~").replace("%20", " ")
        # Wix media files sometimes have suffixes like _mv2, we want to make sure it has an extension
        if "." not in filename:
            filename += ".jpg" # fallback
        return filename
    
    # Fallback
    filename = os.path.basename(path)
    if not filename:
        filename = "scraped_image_" + str(int(time.time())) + ".jpg"
    return filename

def get_high_res_wix_url(url):
    """
    Wix CDN images often contain crop/resize parameters in the path like:
    https://static.wixstatic.com/media/d33d07_3e6a5b26279b48d5b4d500bdbae1d91c~mv2.png/v1/fill/w_192,h_192,lg_1,usm_0.66_1.00_0.01/image.png
    We strip the fill/resize path to get the original high-resolution image:
    https://static.wixstatic.com/media/d33d07_3e6a5b26279b48d5b4d500bdbae1d91c~mv2.png
    """
    if "wixstatic.com/media" in url:
        # Match up to the file extension (e.g. .jpg, .png, .webp, .gif) after /media/
        match = re.match(r'(https://static\.wixstatic\.com/media/[^/]+)', url)
        if match:
            return match.group(1)
    return url

def download_image(url):
    if not url:
        return None
    
    high_res_url = get_high_res_wix_url(url)
    filename = clean_filename(high_res_url)
    filepath = os.path.join(IMAGE_DIR, filename)
    
    if os.path.exists(filepath):
        print(f"Already downloaded: {filename}")
        return os.path.relpath(filepath, OUTPUT_DIR)
        
    print(f"Downloading: {high_res_url}")
    try:
        response = requests.get(high_res_url, timeout=15)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                f.write(response.content)
            return os.path.relpath(filepath, OUTPUT_DIR)
        else:
            print(f"Failed to download {high_res_url}: Status {response.status_code}")
    except Exception as e:
        print(f"Error downloading {high_res_url}: {e}")
    
    # Fallback to original url if high res failed
    if high_res_url != url:
        print(f"Retrying with original URL: {url}")
        try:
            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                return os.path.relpath(filepath, OUTPUT_DIR)
        except Exception as e:
            print(f"Error downloading original {url}: {e}")
            
    return None

def scrape_portfolio():
    site_data = {}
    
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        for page_path in PAGES:
            target_url = urljoin(BASE_URL, page_path)
            print(f"\n--- Navigating to {target_url} ---")
            
            try:
                page.goto(target_url, wait_until="networkidle", timeout=30000)
            except Exception as e:
                print(f"Timeout waiting for network idle on {target_url}, attempting to proceed. Error: {e}")
            
            # Scroll down slowly to trigger lazy-loaded images/content
            print("Scrolling page to load dynamic content...")
            for i in range(5):
                page.evaluate("window.scrollBy(0, window.innerHeight)")
                time.sleep(1)
            page.evaluate("window.scrollTo(0, 0)") # Scroll back to top
            time.sleep(1)
            
            html_content = page.content()
            soup = BeautifulSoup(html_content, 'html.parser')
            
            page_data = {
                "title": page.title(),
                "text_content": [],
                "images": []
            }
            
            # Scrape headings and paragraphs
            for element in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li']):
                text = element.get_text(strip=True)
                if text and len(text) > 3:
                    # Ignore common cookie notices or wix scripts
                    if "cookie" in text.lower() or "javascript" in text.lower():
                        continue
                    page_data["text_content"].append({
                        "tag": element.name,
                        "text": text
                    })
            
            # Scrape images
            # Wix places images inside <img> tags, but also sometimes custom <wix-image> tags or CSS backgrounds
            images_found = []
            
            # 1. Standard <img> tags
            for img in soup.find_all('img'):
                src = img.get('src') or img.get('data-src')
                # Check for other source placeholders Wix uses
                if not src:
                    for attr in img.attrs:
                        if 'src' in attr.lower() and img.attrs[attr].startswith('http'):
                            src = img.attrs[attr]
                            break
                            
                if src and src.startswith('http'):
                    alt = img.get('alt', '').strip()
                    title = img.get('title', '').strip() or img.get('data-title', '').strip()
                    
                    images_found.append({
                        "url": src,
                        "alt": alt,
                        "title": title,
                        "type": "img_tag"
                    })
            
            # 2. Wix custom image structures (like <wix-image> or containers with data-image-info)
            for container in soup.find_all(attrs={"data-image-info": True}):
                try:
                    info_str = container.get("data-image-info")
                    info = json.loads(info_str)
                    # Wix data-image-info contains fields like uri, width, height, title
                    uri = info.get("uri")
                    if uri:
                        url = f"https://static.wixstatic.com/media/{uri}"
                        title = info.get("title", "").strip()
                        alt = info.get("alt", "").strip()
                        images_found.append({
                            "url": url,
                            "alt": alt,
                            "title": title,
                            "type": "wix_image_info"
                        })
                except Exception as e:
                    pass

            # Remove duplicates based on URL
            seen_urls = set()
            unique_images = []
            for img in images_found:
                # Normalize url by resolving Wix format
                norm_url = get_high_res_wix_url(img["url"])
                if norm_url not in seen_urls:
                    seen_urls.add(norm_url)
                    unique_images.append(img)
            
            print(f"Found {len(unique_images)} unique images. Downloading...")
            for img in unique_images:
                local_path = download_image(img["url"])
                if local_path:
                    page_data["images"].append({
                        "original_url": img["url"],
                        "high_res_url": get_high_res_wix_url(img["url"]),
                        "local_path": local_path,
                        "alt": img["alt"],
                        "title": img["title"],
                        "source_type": img["type"]
                    })
            
            site_data[page_path] = page_data
            print(f"Scraped {page_path}: {len(page_data['text_content'])} text blocks, {len(page_data['images'])} images saved.")
            
        browser.close()
        
    # Save structured json data
    with open(os.path.join(OUTPUT_DIR, "scraped_content.json"), "w", encoding="utf-8") as f:
        json.dump(site_data, f, indent=4, ensure_ascii=False)
    
    print("\nScraping complete! Data saved to scraped_data/scraped_content.json")

if __name__ == "__main__":
    scrape_portfolio()
