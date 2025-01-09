function translateText(lang) {
    const texts = {};
    document.querySelectorAll('[data-translate]').forEach(element => {
        texts[element.getAttribute('data-translate')] = element.innerText;
    });

    $.ajax({
        url: '/translate',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ lang: lang, texts: texts }),
        success: function(response) {
            document.querySelectorAll('[data-translate]').forEach(element => {
                element.innerText = response[element.getAttribute('data-translate')];
            });
        },
        error: function(xhr, status, error) {
            console.error('Translation error:', error);
        }
    });
}

function updateTableHeader() {
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    const location = document.getElementById('location').value; // Aggiungi questa linea
    
    if (!month || !year || !location) return; // Aggiungi controllo per la sede

    const daysInMonth = new Date(year, new Date(Date.parse(month + " 1," + year)).getMonth() + 1, 0).getDate();
    const tableHeader = document.getElementById('table_header');
    
    // Clear existing header cells
    tableHeader.innerHTML = '<th data-translate="Type">Tipo</th>';
    
    // Add new header cells
    for (let i = 1; i <= daysInMonth; i++) {
        const th = document.createElement('th');
        th.innerText = i;
        
        // Get the day of the week
        const date = new Date(year, new Date(Date.parse(month + " 1," + year)).getMonth(), i);
        const dayOfWeek = date.getDay();
        
        // Color the cell based on the day of the week
        if (dayOfWeek === 6) { // Saturday
            th.style.backgroundColor = 'orange';
        } else if (dayOfWeek === 0) { // Sunday
            th.style.backgroundColor = 'red';
        } else if (isHoliday(date)) { // National holiday
            th.style.backgroundColor = 'blue';
        } else if (isPatronalHoliday(date)) { // Patronal holiday
            th.style.backgroundColor = 'green';
        }
        
        tableHeader.appendChild(th);
    }
}
// Aggiungi il listener per l'evento change all'elemento location
document.getElementById('location').addEventListener('change', updateTableHeader);

// Altri listener per gli eventi change di month e year
document.getElementById('month').addEventListener('change', updateTableHeader);
document.getElementById('year').addEventListener('change', updateTableHeader);

function isHoliday(date) {
    const holidays = [
        '01-01', // New Year's Day
        '06-01', // Epiphany
        '25-04', // Liberation Day
        '01-05', // Labor Day
        '02-06', // Republic Day
        '15-08', // Assumption Day
        '01-11', // All Saints' Day
        '08-12', // Immaculate Conception
        '25-12', // Christmas Day
        '26-12'  // St. Stephen's Day
    ];

    // Add Easter and Pasquetta for specific years
    const easterDates = {
        '2024': ['31-03', '01-04'],
        '2025': ['20-04', '21-04'],
        '2026': ['05-04', '06-04'],
        '2027': ['28-03', '29-03'],
        '2028': ['16-04', '17-04']
    };

    const formattedDate = ('0' + date.getDate()).slice(-2) + '-' + ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear().toString();

    return holidays.includes(formattedDate) || (easterDates[year] && easterDates[year].includes(formattedDate));
}

function isPatronalHoliday(date) {
    const patronalHolidays = {
        'BRESCIA': ['15-02'], // Example date for Brescia
        'CREMONA': ['13-11'], // Example date for Cremona
        'MANTOVA': ['18-03'], // Example date for Mantova
        'PADOVA': ['13-06'], // Example date for Padova
        'PARMA': ['13-01'], // Example date for Parma
        'TRENTO': ['26-06'] // Example date for Trento
    };

    const formattedDate = ('0' + date.getDate()).slice(-2) + '-' + ('0' + (date.getMonth() + 1)).slice(-2);
    const location = document.getElementById('location').value;

    return patronalHolidays[location] && patronalHolidays[location].includes(formattedDate);
}

function updateTableRows() {
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    
    if (!month || !year) return;

    const daysInMonth = new Date(year, new Date(Date.parse(month + " 1," + year)).getMonth() + 1, 0).getDate();
    const tableBody = document.getElementById('table_body');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add new rows
    ["Ordinarie", "Assenze", "Altro"].forEach(rowType => {
        const row = document.createElement('tr');
        
        const cell = document.createElement('td');
        cell.innerText = rowType;
        row.appendChild(cell);
        
        for (let i = 1; i <= daysInMonth; i++) {
            const cell = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.min = 0;
            input.max = 8;
            input.step = 0.25;
            input.oninput = updateTotalHours;
            input.addEventListener('input', saveData);
            cell.appendChild(input);
            row.appendChild(cell);
        }
        
        tableBody.appendChild(row);
    });
}

function updateTotalHours() {
    const tableBody = document.getElementById('table_body');
    let totalHoursOrdinarie = 0;
    let totalHoursAssenze = 0;
    let totalHoursAltro = 0;
    
    for (let i = 0; i < tableBody.rows.length; i++) {
        const row = tableBody.rows[i];
        for (let j = 1; j < row.cells.length; j++) {
            const input = row.cells[j].querySelector('input');
            if (input && input.value) {
                if (i === 0) {
                    totalHoursOrdinarie += parseFloat(input.value); // Use parseFloat to handle decimal values
                } else if (i === 1) {
                    totalHoursAssenze += parseFloat(input.value); // Use parseFloat to handle decimal values
                } else if (i === 2) {
                    totalHoursAltro += parseFloat(input.value); // Use parseFloat to handle decimal values
                }
            }
        }
    }
    
    document.getElementById('total_hours').value = totalHoursOrdinarie;
    document.getElementById('total_absences').value = totalHoursAssenze;
    document.getElementById('total_other').value = totalHoursAltro;
}
function createPDF() {
    const name = document.getElementById('name').value;
    const surname = document.getElementById('surname').value;
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    const location = document.getElementById('location').value;
    const notes = document.getElementById('notes').value; // Aggiungi questa linea
    
    // Clear previous error messages
    clearErrors();
    
    // Validate required fields
    let valid = true;
    if (!name) {
        showError('name', "Il campo 'Nome' è obbligatorio.");
        valid = false;
    }
    if (!surname) {
        showError('surname', "Il campo 'Cognome' è obbligatorio.");
        valid = false;
    }
    if (!month) {
        showError('month', "Il campo 'Mese' è obbligatorio.");
        valid = false;
    }
    if (!year) {
        showError('year', "Il campo 'Anno' è obbligatorio.");
        valid = false;
    }
    if (!location) {
        showError('location', "Il campo 'Sede' è obbligatorio.");
        valid = false;
    }
    
    if (!valid) return;

    const rows = { "Ordinarie": [], "Assenze": [], "Altro": [] };
    
    $('#table_body tr').each(function(index) {
       $(this).find('input').each(function() {
           rows[index === 0 ? "Ordinarie" : index === 1 ? "Assenze" : "Altro"].push($(this).val());
       });
    });
    
    const data = { name: name, surname: surname, month: month, year: year, location: location, rows: rows, notes: notes }; // Aggiungi notes ai dati
    
    $.ajax({
        url: '/create_pdf',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            const link = document.getElementById('download_link');
            link.href = response.pdf_path;
            link.style.display = 'block';
        },
        error: function(xhr, status, error) {
            const errors = xhr.responseJSON.errors;
            for (const field in errors) {
                showError(field, errors[field]);
            }
        }
    });
}

function showError(field, message) {
    const input = document.getElementById(field);
    if (input) {
        const error = document.createElement('div');
        error.className = 'error-message';
        error.style.color = 'red';
        error.innerText = message;
        input.parentNode.appendChild(error);
    }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(element => element.remove());
}

function saveData() {
    const name = document.getElementById('name').value;
    const surname = document.getElementById('surname').value;
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    const location = document.getElementById('location').value;
    const notes = document.getElementById('notes').value;

    const rows = { "Ordinarie": [], "Assenze": [], "Altro": [] };
    
    $('#table_body tr').each(function(index) {
       $(this).find('input').each(function() {
           rows[index === 0 ? "Ordinarie" : index === 1 ? "Assenze" : "Altro"].push($(this).val());
       });
    });
    
    const data = { name: name, surname: surname, month: month, year: year, location: location, rows: rows, notes: notes };
    console.log('Saving data:', data); // Aggiungi questo per il debug
    localStorage.setItem('timesheetData', JSON.stringify(data));
    localStorage.setItem('selectedMonth', month);
    localStorage.setItem('selectedYear', year);
    localStorage.setItem('selectedLocation', location); // Salva la sede selezionata
}

function loadData() {
    const data = JSON.parse(localStorage.getItem('timesheetData'));
    const savedMonth = localStorage.getItem('selectedMonth');
    const savedYear = localStorage.getItem('selectedYear');
    const savedLocation = localStorage.getItem('selectedLocation'); // Carica la sede selezionata
    
    console.log('Loading data:', data); // Aggiungi questo per il debug
    
    if (savedMonth && savedYear) {
        document.getElementById('month').value = savedMonth;
        document.getElementById('year').value = savedYear;
        updateTableHeader();
    }
    
    if (savedLocation) {
        document.getElementById('location').value = savedLocation;
    }
    
    if (data) {
        document.getElementById('name').value = data.name;
        document.getElementById('surname').value = data.surname;
        document.getElementById('month').value = data.month;
        document.getElementById('year').value = data.year;
        document.getElementById('location').value = data.location;
        document.getElementById('notes').value = data.notes;
        
        const tableBody = document.getElementById('table_body');
        tableBody.innerHTML = '';
        
        ["Ordinarie", "Assenze", "Altro"].forEach((rowType, index) => {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.innerText = rowType;
            row.appendChild(cell);
            
            data.rows[rowType].forEach((cellData, cellIndex) => {
                const cell = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'number';
                input.min = 0;
                input.max = 8;
                input.step = 0.25;
                input.value = cellData;
                input.oninput = updateTotalHours;
                input.addEventListener('input', saveData);
                cell.appendChild(input);
                row.appendChild(cell);
            });
            
            tableBody.appendChild(row);
        });
        
        updateTotalHours();
    }
}

function updateTableHeader() {
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    
    if (!month || !year) return;

    const daysInMonth = new Date(year, new Date(Date.parse(month + " 1," + year)).getMonth() + 1, 0).getDate();
    const tableHeader = document.getElementById('table_header');
    
    // Clear existing header cells
    tableHeader.innerHTML = '<th data-translate="Type">Tipo</th>';
    
    // Add new header cells
    for (let i = 1; i <= daysInMonth; i++) {
        const th = document.createElement('th');
        th.innerText = i;
        
        // Get the day of the week
        const date = new Date(year, new Date(Date.parse(month + " 1," + year)).getMonth(), i);
        const dayOfWeek = date.getDay();
        
        // Color the cell based on the day of the week
        if (dayOfWeek === 6) { // Saturday
            th.style.backgroundColor = 'orange';
        } else if (dayOfWeek === 0) { // Sunday
            th.style.backgroundColor = 'red';
        } else if (isHoliday(date)) { // National holiday
            th.style.backgroundColor = 'blue';
        } else if (isPatronalHoliday(date)) { // Patronal holiday
            th.style.backgroundColor = 'green';
        }
        
        tableHeader.appendChild(th);
    }
}

function clearData() {
    document.getElementById('name').value = '';
    document.getElementById('surname').value = '';
    document.getElementById('month').value = '';
    document.getElementById('year').value = '';
    document.getElementById('location').value = '';
    document.getElementById('notes').value = '';
    document.getElementById('table_body').innerHTML = '';
    document.getElementById('total_hours').value = '';
    document.getElementById('total_absences').value = '';
    document.getElementById('total_other').value = '';
    localStorage.removeItem('timesheetData');
    localStorage.removeItem('selectedMonth');
    localStorage.removeItem('selectedYear');
    localStorage.removeItem('selectedLocation'); // Rimuovi la sede selezionata
}

// Call loadData when the page loads
window.onload = function() {
    loadData();
    updateTableHeader(); // Assicurati che l'intestazione della tabella venga aggiornata al caricamento della pagina
};
<script src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" async=""></script>
<script>
    window.OneSignal = window.OneSignal || [];
    OneSignal.push(function() {
        OneSignal.init({
            appId: "a50aa7f7-f4ed-4ad9-9b27-2918466cad0d",
            notifyButton: {
                enable: true,
            },
            welcomeNotification: {
                "title": "Benvenuto!",
                "message": "Grazie per aver attivato le notifiche!",
            }
        });

        // Punto 2: Richiesta di permesso per le notifiche
        OneSignal.showSlidedownPrompt();

        // Punto 3: Gestione degli eventi di iscrizione
        OneSignal.on('subscriptionChange', function(isSubscribed) {
            console.log("L'utente è iscritto:", isSubscribed);
        });

        OneSignal.on('notificationPermissionChange', function(permissionChange) {
            const currentPermission = permissionChange.to;
            console.log("Permesso di notifica:", currentPermission);
        });
    });
</script>
// Save data when the user leaves the page
window.onbeforeunload = saveData;