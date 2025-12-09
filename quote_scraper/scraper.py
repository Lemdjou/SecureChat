import requests
import csv

# Ouvre le fichier CSV en mode écriture. Le 'with' s'assure qu'il sera bien fermé.
with open("quotes.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    # Écrit la première ligne (l'en-tête)
    writer.writerow(["auteur", "citation"])

    # Boucle sur les 10 premières pages du site
    for page in range(1, 11):
        url = f"https://quotes.toscrape.com/page/{page}/"
        print(f"Scraping en cours : {url}")

        r = requests.get(url)
        # Sépare le contenu HTML en une liste de lignes
        html = r.text.split("\n")

        # Crée des listes vides pour stocker les données de la page actuelle
        quotes_sur_page = []
        auteurs_sur_page = []

        # Parcourt chaque ligne du HTML
        for line in html:
            # Si la ligne contient le début d'une citation
            if '<span class="text" itemprop="text">' in line:
                # Nettoie la ligne pour ne garder que le texte de la citation
                quote = line.replace('<span class="text" itemprop="text">', '').replace('</span>', '').strip()
                # Enlève les caractères “ et ” du début et de la fin
                quote = quote.strip('“').strip('”')
                quotes_sur_page.append(quote)

            # Si la ligne contient le nom d'un auteur
            if '<span>by <small class="author" itemprop="author">' in line:
                # Nettoie la ligne pour ne garder que le nom de l'auteur
                author = line.replace('<span>by <small class="author" itemprop="author">', '').replace('</small>', '').strip()
                auteurs_sur_page.append(author)

        # Une fois la page entière analysée, on associe les auteurs et les citations
        # On suppose qu'il y a autant d'auteurs que de citations sur la page
        for i in range(len(quotes_sur_page)):
            # On vérifie qu'un auteur existe bien pour cette citation pour éviter une erreur
            if i < len(auteurs_sur_page):
                writer.writerow([auteurs_sur_page[i], quotes_sur_page[i]])

    print("Scraping terminé avec succès !")
