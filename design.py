import os
import re
import json
import time
import random
import logging
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class MangaDownloader:
    def __init__(self, base_url, manga_name, chapter_start=None, chapter_end=None, download_path='downloads', user_agent=None, request_delay=1):
        """
        Initializes the MangaDownloader.

        Args:
            base_url (str): The base URL of the manga website.
            manga_name (str): The name of the manga.
            chapter_start (float, optional): The starting chapter number. Defaults to None (downloads all).
            chapter_end (float, optional): The ending chapter number. Defaults to None (downloads all).
            download_path (str, optional): The path to save downloaded manga. Defaults to 'downloads'.
            user_agent (str, optional): The user agent string to use for requests. Defaults to a random browser user agent.
            request_delay (int, optional): Delay in seconds between requests. Defaults to 1.
        """
        self.base_url = self._normalize_url(base_url)
        self.manga_name = self._sanitize_filename(manga_name)
        self.chapter_start = chapter_start
        self.chapter_end = chapter_end
        self.download_path = os.path.join(download_path, self.manga_name)
        os.makedirs(self.download_path, exist_ok=True)
        self.request_delay = request_delay
        self.session = requests.Session()
        self.headers = {'User-Agent': user_agent if user_agent else self._get_random_user_agent()}
        self.session.headers.update(self.headers)
        self.chapter_list = []
        logging.info(f"Initialized downloader for '{self.manga_name}' from '{self.base_url}'")

    def _normalize_url(self, url):
        """Normalizes the URL to ensure consistency."""
        parsed_url = urlparse(url)
        return f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path.rstrip('/')}/"

    def _sanitize_filename(self, filename):
        """Removes or replaces invalid characters for filenames."""
        return re.sub(r'[^\w\s-]', '', filename).strip()

    def _get_random_user_agent(self):
        """Returns a random browser user agent string."""
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.2210.144",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/16.6 Safari/605.1.15"
        ]
        return random.choice(user_agents)

    def _send_request(self, url, method='get', **kwargs):
        """Sends an HTTP request with built-in delay and error handling."""
        try:
            time.sleep(self.request_delay)
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
            return response
        except requests.exceptions.RequestException as e:
            logging.error(f"Request failed for {url}: {e}")
            return None

    def get_chapter_list(self):
        """
        Abstract method to be implemented by subclasses to fetch the list of chapters.
        Should populate self.chapter_list with tuples of (chapter_number, chapter_url).
        """
        raise NotImplementedError("Subclasses must implement the get_chapter_list method.")

    def download_chapter(self, chapter_number, chapter_url):
        """
        Abstract method to be implemented by subclasses to download a single chapter.
        """
        raise NotImplementedError("Subclasses must implement the download_chapter method.")

    def download_manga(self):
        """
        Downloads the manga chapters within the specified range.
        """
        logging.info(f"Fetching chapter list for '{self.manga_name}'...")
        self.get_chapter_list()

        if not self.chapter_list:
            logging.warning(f"No chapters found for '{self.manga_name}'.")
            return

        logging.info(f"Found {len(self.chapter_list)} chapters.")

        for chapter_num, chapter_url in self.chapter_list:
            if self.chapter_start is not None and chapter_num < self.chapter_start:
                continue
            if self.chapter_end is not None and chapter_num > self.chapter_end:
                continue

            chapter_name = f"Chapter {chapter_num}"
            chapter_dir = os.path.join(self.download_path, self._sanitize_filename(chapter_name))
            os.makedirs(chapter_dir, exist_ok=True)
            logging.info(f"Downloading {chapter_name} from {chapter_url}")
            self.download_chapter(chapter_num, chapter_url)
            logging.info(f"Finished downloading {chapter_name}")

        logging.info(f"Finished downloading manga '{self.manga_name}'.")

if __name__ == "__main__":
    # Example usage (will raise NotImplementedError as MangaDownloader is abstract)
    base_url = "https://example.com/"
    manga_name = "Test Manga"
    downloader = MangaDownloader(base_url, manga_name, chapter_start=1, chapter_end=2)
    try:
        downloader.download_manga()
    except NotImplementedError as e:
        logging.warning(f"Example usage requires a concrete MangaDownloader subclass: {e}")
class MangaSeeDownloader(MangaDownloader):
    def __init__(self, base_url, manga_name, chapter_start=None, chapter_end=None, download_path='downloads', user_agent=None, request_delay=1):
        super().__init__(base_url, manga_name, chapter_start, chapter_end, download_path, user_agent, request_delay)

    def get_chapter_list(self):
        chapter_list_url = urljoin(self.base_url, f"manga/{self.manga_name.replace(' ', '-')}")
        response = self._send_request(chapter_list_url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            chapter_table = soup.find('table', class_='table table-striped')
            if chapter_table:
                for row in chapter_table.find_all('tr')[1:]:  # Skip the header row
                    columns = row.find_all('td')
                    if len(columns) >= 2:
                        link_tag = columns[0].find('a')
                        if link_tag and 'href' in link_tag.attrs:
                            chapter_url = urljoin(self.base_url, link_tag['href'])
                            chapter_number_text = columns[0].get_text(strip=True)
                            match = re.search(r'Chapter\s*([\d.]+)', chapter_number_text, re.IGNORECASE)
                            if match:
                                try:
                                    chapter_number = float(match.group(1))
                                    self.chapter_list.append((chapter_number, chapter_url))
                                except ValueError:
                                    logging.warning(f"Could not parse chapter number from '{chapter_number_text}'")
            self.chapter_list.reverse()  # Chapters are usually listed in reverse order
        return self.chapter_list

    def download_chapter(self, chapter_number, chapter_url):
        response = self._send_request(chapter_url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            image_container = soup.find('div', id='viewer-area')
            if image_container:
                img_tags = image_container.find_all('img', class_='img-fluid')
                for i, img_tag in enumerate(img_tags):
                    if 'src' in img_tag.attrs:
                        image_url = img_tag['src']
                        if not image_url.startswith('http'):
                            image_url = urljoin(self.base_url, image_url)
                        self._download_image(chapter_number, image_url, i + 1)

    def _download_image(self, chapter_number, image_url, image_number):
        """Downloads a single image."""
        response = self._send_request(image_url, stream=True)
        if response and response.status_code == 200:
            chapter_name = f"Chapter {chapter_number}"
            chapter_dir = os.path.join(self.download_path, self._sanitize_filename(chapter_name))
            os.makedirs(chapter_dir, exist_ok=True)
            file_extension = os.path.splitext(urlparse(image_url).path)[-1]
            image_filename = f"{image_number:03d}{file_extension}"
            filepath = os.path.join(chapter_dir, image_filename)
            try:
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                logging.info(f"Downloaded image {image_number} from {image_url}")
            except Exception as e:
                logging.error(f"Error saving image {image_url}: {e}")
class MangaDexDownloader(MangaDownloader):
    def __init__(self, base_url="https://mangadex.org", manga_name=None, chapter_start=None, chapter_end=None, download_path='downloads', user_agent=None, request_delay=1, manga_id=None, preferred_language='en'):
        super().__init__(base_url, manga_name, chapter_start, chapter_end, download_path, user_agent, request_delay)
        self.manga_id = manga_id
        self.preferred_language = preferred_language
        if not self.manga_id and not self.manga_name:
            raise ValueError("Either manga_id or manga_name must be provided for MangaDex.")
        if self.base_url == "https://mangadex.org" and not self.manga_id:
            logging.warning("Using manga name for MangaDex can be less reliable. Consider providing the manga_id.")

    def _get_manga_id_from_name(self):
        """Fetches the manga ID from MangaDex API based on the manga name."""
        search_url = f"{self.base_url}/api/manga"
        params = {'title': self.manga_name}
        response = self._send_request(search_url, params=params)
        if response and response.status_code == 200:
            data = response.json()
            if data['result'] == 'ok' and data['total'] > 0:
                return data['data'][0]['id']
            else:
                logging.warning(f"Could not find manga ID for '{self.manga_name}' on MangaDex.")
                return None
        return None

    def get_chapter_list(self):
        if not self.manga_id:
            self.manga_id = self._get_manga_id_from_name()
            if not self.manga_id:
                return []

        chapter_list_url = f"{self.base_url}/api/manga/{self.manga_id}/chapters"
        offset = 0
        limit = 100
        all_chapters = []

        while True:
            params = {'limit': limit, 'offset': offset, 'translatedLanguage[]': [self.preferred_language], 'order[chapter]': 'asc'}
            response = self._send_request(chapter_list_url, params=params)
            if response and response.status_code == 200:
                data = response.json()
                if data['result'] == 'ok' and data['data']:
                    all_chapters.extend(data['data'])
                    offset += limit
                else:
                    break
            else:
                break

        for chapter_data in all_chapters:
            chapter_number_str = chapter_data['attributes']['chapter']
            if chapter_number_str:
                try:
                    chapter_number = float(chapter_number_str)
                    chapter_id = chapter_data['id']
                    self.chapter_list.append((chapter_number, chapter_id))
                except ValueError:
                    logging.warning(f"Could not parse chapter number from '{chapter_number_str}' (ID: {chapter_id})")

        return sorted(self.chapter_list, key=lambda x: x[0])

    def download_chapter(self, chapter_number, chapter_id):
        chapter_info_url = f"{self.base_url}/api/chapter/{chapter_id}"
        response = self._send_request(chapter_info_url)
        if response and response.status_code == 200:
            chapter_data = response.json()
            if chapter_data['result'] == 'ok':
                base_url = chapter_data['data']['attributes']['dataSaver']
                image_filenames = chapter_data['data']['attributes']['dataSaver']
                for i, filename in enumerate(image_filenames):
                    image_url = f"{self.base_url}/data-saver/{chapter_data['id']}/{filename}"
                    self._download_image(chapter_number, image_url, i + 1)
            else:
                logging.error(f"Failed to fetch chapter info for ID {chapter_id}")

    def _download_image(self, chapter_number, image_url, image_number):
        """Downloads a single image."""
        response = self._send_request(image_url)
        if response and response.status_code == 200:
            chapter_name = f"Chapter {chapter_number}"
            chapter_dir = os.path.join(self.download_path, self._sanitize_filename(chapter_name))
            os.makedirs(chapter_dir, exist_ok=True)
            file_extension = os.path.splitext(urlparse(image_url).path)[-1].split('?')[0] # Handle query parameters in URL
            image_filename = f"{image_number:03d}{file_extension}"
            filepath = os.path.join(chapter_dir, image_filename)
            try:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                logging.info(f"Downloaded image {image_number} from {image_url}")
            except Exception as e:
                logging.error(f"Error saving image {image_url}: {e}")
class MangaKakalotDownloader(MangaDownloader):
    def __init__(self, base_url, manga_name, chapter_start=None, chapter_end=None, download_path='downloads', user_agent=None, request_delay=1):
        super().__init__(base_url, manga_name, chapter_start, chapter_end, download_path, user_agent, request_delay)

    def get_chapter_list(self):
        manga_url = urljoin(self.base_url, f"manga/{self.manga_name.replace(' ', '_')}")
        response = self._send_request(manga_url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            chapter_list_div = soup.find('div', class_='chapter-list')
            if chapter_list_div:
                for link_tag in chapter_list_div.find_all('a'):
                    if 'href' in link_tag.attrs and 'chapter' in link_tag['href']:
                        chapter_url = urljoin(self.base_url, link_tag['href'])
                        chapter_title = link_tag.get_text(strip=True)
                        match = re.search(r'Chapter\s*([\d.]+)', chapter_title, re.IGNORECASE)
                        if match:
                            try:
                                chapter_number = float(match.group(1))
                                self.chapter_list.append((chapter_number, chapter_url))
                            except ValueError:
                                logging.warning(f"Could not parse chapter number from '{chapter_title}'")
            self.chapter_list.reverse()
        return self.chapter_list

    def download_chapter(self, chapter_number, chapter_url):
        response = self._send_request(chapter_url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            container_div = soup.find('div', class_='container-chapter-reader')
            if container_div:
                img_tags = container_div.find_all('img')
                for i, img_tag in enumerate(img_tags):
                    if 'src' in img_tag.attrs:
                        image_url = img_tag['src']
                        self._download_image(chapter_number, image_url, i + 1)
            else:
                logging.warning(f"Could not find images in chapter {chapter_number} at {chapter_url}")

    def _download_image(self, chapter_number, image_url, image_number):
        """Downloads a single image."""
        response = self._send_request(image_url, stream=True)
        if response and response.status_code == 200:
            chapter_name = f"Chapter {chapter_number}"
            chapter_dir = os.path.join(self.download_path, self._sanitize_filename(chapter_name))
            os.makedirs(chapter_dir, exist_ok=True)
            file_extension = os.path.splitext(urlparse(image_url).path)[-1].split('?')[0]
            image_filename = f"{image_number:03d}{file_extension}"
            filepath = os.path.join(chapter_dir, image_filename)
            try:
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                logging.info(f"Downloaded image {image_number} from {image_url}")
            except Exception as e:
                logging.error(f"Error saving image {image_url}: {e}")
if __name__ == "__main__":
    # Example Usage:

    # MangaSee Example
    # base_url_mangasee = "https://mangasee123.com"
    # manga_name_mangasee = "Shingeki-No-Kyojin"
    # downloader_mangasee = MangaSeeDownloader(base_url_mangasee, manga_name_mangasee, chapter_start=1, chapter_end=5, download_path='manga')
    # downloader_mangasee.download_manga()

    # MangaDex Example (replace with actual manga ID or name)
    # base_url_mangadex = "https://mangadex.org"
    # manga_id_mangadex = "YOUR_MANGA_ID"  # Replace with the actual MangaDex ID
    # manga_name_mangadex = "Attack on Titan" # Fallback if ID is not provided
    # downloader_mangadex = MangaDexDownloader(base_url_mangadex, manga_name=manga_name_mangadex, manga_id=manga_id_mangadex, chapter_start=1, chapter_end=3, download_path='manga_dex')
    # downloader_mangadex.download_manga()

    # MangaKakalot Example
    # base_url_mangakakalot = "https://mangakakalot.com"
    # manga_name_mangakakalot = "attack_on_titan" # Use the name as it appears in the URL
    # downloader_mangakakalot = MangaKakalotDownloader(base_url_mangakakalot, manga_name_mangakakalot, chapter_start=1, chapter_end=2, download_path='manga_kakalot')
    # downloader_mangakakalot.download_manga()

    # You can uncomment and configure the downloader you want to use.
    # Remember to install the necessary libraries: pip install requests beautifulsoup4
    pass

