import requests
from bs4 import BeautifulSoup
import csv
import time

def get_item_links(page_number , category):
    # Extracts individual product links
    url = f"https://www.pawnamerica.com/Shop?category={category}&page={page_number}"
    response = requests.get(url)

    if response.status_code != 200:
        print(f"Failed to retrieve page {page_number}. Status code: {response.status_code}")
        return []

    soup = BeautifulSoup(response.content, 'html.parser')

    # Find all product items and their links
    items = soup.find_all('div', class_='ps-product__thumbnail')
    links = []

    for item in items:
        link_tag = item.find('a') 
        if link_tag and link_tag.get('href'):
            link = "https://www.pawnamerica.com" + link_tag['href']
            links.append(link)

    return links

def scrape_item_details(item_url):
    # Scrapes detailed information from an individual items
    response = requests.get(item_url)

    if response.status_code != 200:
        print(f"Failed to retrieve item details from {item_url}. Status code: {response.status_code}")
        return None

    soup = BeautifulSoup(response.content, 'html.parser')

    name_tag = soup.find('h1', attrs={'data-title': True})
    name = name_tag['data-title'].strip() if name_tag else 'N/A'
    
    price = soup.find('h4', class_='ps-product__price').get_text(strip=True)

    specification_div = soup.find('div', class_='ps-product__specification')
    if specification_div:

        item_id_tag = specification_div.find_all('p')[1]
        item_id = item_id_tag.get_text(strip=True).split(':')[1].strip() if item_id_tag else 'N/A'

        category_tag = specification_div.find('p', class_='categories')
        category = category_tag.find('a').get_text(strip=True) if category_tag else 'N/A'
    else:
        item_id = 'N/A'
        category = 'N/A'
    
    # Extracting the description
    description_div = soup.find('div', id='longDescriptionDiv')
    description_list = description_div.find_all('li')
    description = ' '.join(li.get_text(strip=True) for li in description_list)

    return {
        'name': name,
        'price': price,
        'item_id': item_id,
        'category': category,
        'description': description,
    }


def scrape_multiple_pages(start_page, end_page, category):
    # Scrapes multiple pages of the category specified
    all_data = []

    for page in range(start_page, end_page + 1):
        print(f"Scraping page {page}...")
        item_links = get_item_links(page,category)

        for link in item_links:
            print(f"Scraping item details from {link}...")
            item_data = scrape_item_details(link)
            if item_data:
                print(item_data)
                all_data.append(item_data)
            else:
                print("No item data found for this item", link)
            time.sleep(1)  # Delay between requests

        print(f"Collected data from {len(item_links)} items on page {page}")

    return all_data

def save_to_csv(data, filename):
    # Saves the scraped data to a CSV file
    header = ['name', 'price','item_id','category','description']
    
    # Open the file in write mode
    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=header)
        
        # Write the header
        writer.writeheader()
        
        # Write the rows
        for item in data:
            writer.writerow(item)

# Example usage
start_page = 1
end_page = 3
category = "Collectibles"
scraped_items = scrape_multiple_pages(start_page, end_page, category)

print(scraped_items)

# Save data to CSV
csv_filename = f'{category}.csv'
save_to_csv(scraped_items, csv_filename)

print(f"Data scraping complete. Saved to '{csv_filename}'.")



