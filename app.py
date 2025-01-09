from flask import Flask, render_template, request, jsonify, send_file
import fitz  # PyMuPDF
import os
import calendar
from datetime import datetime

app = Flask(__name__)

# Function to translate text
def translate_text(text, lang):
    translations = {
        'it': {
            'FOGLIO ORE MENSILE AL CENTRO': 'FOGLIO ORE MENSILE AL CENTRO',
            'Translate to Italian': 'Traduci in Italiano',
            'Translate to English': 'Traduci in Inglese',
            'Translate to French': 'Traduci in Francese',
            'Name': 'Nome',
            'Surname': 'Cognome',
            'Month': 'Mese',
            'Year': 'Anno',
            'Site': 'Cantiere',
            'Create PDF': 'CREA PDF',
            'Download PDF': 'Scarica PDF',
            'Clear Data': 'Cancella Dati',
            'Location': 'Sede',
            'Notes': 'Note'
        },
        'en': {
            'FOGLIO ORE MENSILE AL CENTRO': 'MONTHLY TIMESHEET CENTERED',
            'Translate to Italian': 'Translate to Italian',
            'Translate to English': 'Translate to English',
            'Translate to French': 'Translate to French',
            'Name': 'Name',
            'Surname': 'Surname',
            'Month': 'Month',
            'Year': 'Year',
            'Site': 'Site',
            'Create PDF': 'Create PDF',
            'Download PDF': 'Download PDF',
            'Clear Data': 'Clear Data',
            'Location': 'Location',
            'Notes': 'Notes'
        },
        'fr': {
            'FOGLIO ORE MENSILE AL CENTRO': "FEUILLE D'HEURES MENSUELLE CENTRÉE",
            'Translate to Italian': "Traduire en Italien",
            'Translate to English': "Traduire en Anglais",
            'Translate to French': "Traduire en Français",
            'Name': "Nom",
            'Surname': "Prénom",
            'Month': "Mois",
            'Year': "Année",
            "Site": "Chantier",
            "Create PDF": "Créer PDF",
            "Download PDF": "Télécharger PDF",
            "Clear Data": "Effacer les Données",
            "Location": "Lieu",
            "Notes": "Notes"
        }
    }
    return translations[lang].get(text, text)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/translate', methods=['POST'])
def translate():
    data = request.json
    lang = data['lang']
    translated_texts = {key: translate_text(key, lang) for key in data['texts']}
    return jsonify(translated_texts)

@app.route('/create_pdf', methods=['POST'])
def create_pdf():
    data = request.json
    
    # Check for required fields
    required_fields = ['name', 'surname', 'month', 'year', 'location']
    errors = {}
    for field in required_fields:
        if not data.get(field):
            errors[field] = f"Il campo '{field}' è obbligatorio."
    
    if errors:
        return jsonify({'errors': errors}), 400
    
    pdf_path = os.path.join('static', f"{data['name']}_{data['surname']}_{data['month']}_{data['year']}.pdf")
    
    try:
        # Log received data
        print("Received data:", data)
        
        # Create PDF with PyMuPDF in landscape mode
        doc = fitz.open()
        page_width, page_height = fitz.paper_size("a4")
        
        page = doc.new_page(width=page_height, height=page_width)  # A4 landscape
        
        # Insert text
        page.insert_text((30, 72), f"Nome: {data['name']}\nCognome: {data['surname']}\nMese: {data['month']}\nAnno: {data['year']}\nSede: {data['location']}")
        print("Inserted text")
        
        # Add table headers
        headers = ["Tipo"] + [str(i) for i in range(1, 32)]
        header_positions = []
        x = 34
        for i, header in enumerate(headers):
            page.insert_text((x, 172), header)
            header_positions.append(x)
            if i == 0:
                x += 50  # Width for the first column (40 px cell width + 10 px spacing)
            else:
                x += 24  # Width for other columns (14 px cell width + 10 px spacing)
        
        print("Inserted headers")
        
        # Add table rows with specific cell sizes and positions
        y = 192
        total_hours_ordinarie = 0
        total_hours_assenze = 0
        total_hours_altro = 0
        
        for row_type in ["Ordinarie", "Assenze", "Altro"]:
            # Insert the first cell at x = 72 with a width of 40 px
            page.insert_text((34, y), row_type)
            
            # Set the starting position for the next cells
            x = 84
            
            # Insert the remaining cells with a width of 10 px and spaced by 10 px
            for cell_text in data['rows'][row_type]:
                page.insert_text((x, y), cell_text)
                try:
                    if row_type == "Ordinarie":
                        total_hours_ordinarie += float(cell_text)  # Use float to handle decimal values
                    elif row_type == "Assenze":
                        total_hours_assenze += float(cell_text)  # Use float to handle decimal values
                    elif row_type == "Altro":
                        total_hours_altro += float(cell_text)  # Use float to handle decimal values
                except ValueError:
                    pass
                x += 14 + 10
            
            y += 20
        print("Inserted rows")
        
        # Insert total hours worked below the table
        y += 20
        page.insert_text((30, y), f"Totale ore lavorate: {total_hours_ordinarie}")
        
        y += 20
        page.insert_text((30, y), f"Totale assenze: {total_hours_assenze}")
        
        y += 20
        page.insert_text((30, y), f"Totale altro: {total_hours_altro}")
        
        # Insert notes at the bottom
        y += 40
        page.insert_text((30, y), f"Note: {data.get('notes', '')}")
        
        # Add signature fields at the bottom of the page
        y += 60
        page.insert_text((30, y), "Firma:")
        
        y += 40
        page.insert_text((30, y), "Firma Responsabile:")
        
        # Save PDF
        doc.save(pdf_path)
        doc.close()
        print("PDF saved at:", pdf_path)
        
        return jsonify({'pdf_path': pdf_path})
    
    except Exception as e:
        print("Error:", str(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)