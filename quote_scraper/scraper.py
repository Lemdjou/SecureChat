import requests
import csv
from bs4 import BeautifulSoup

# Open the CSV file in write mode and create a writer object
# This will keep the file open for the duration of the script
with open("quotes.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    # Write the header row
    writer.writerow(["auteur", "citation"])

    # Loop through the first 10 pages of the website
    for page in range(1, 11):
        url = f"https://quotes.toscrape.com/page/{page}/"
        print(f"Scraping: {url}")

        # Fetch the HTML content of the page
        r = requests.get(url)
        soup = BeautifulSoup(r.text, "html.parser")

        # Find all the quote containers on the page
        quotes = soup.find_all("div", class_="quote")

        # Extract the author and quote text from each container
        for quote in quotes:
            text = quote.find("span", class_="text").text
            author = quote.find("small", class_="author").text

            # Write the author and quote to the CSV file
            writer.writerow([author, text])

print("Scraping successful!")
