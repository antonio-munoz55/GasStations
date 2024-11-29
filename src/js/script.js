// Base URL for the API and endpoints to fetch data
const base = "https://sedeaplicaciones.minetur.gob.es/";
const provincesEndpoint = "ServiciosRESTCarburantes/PreciosCarburantes/Listados/Provincias/";
const municipalitiesEndpoint = "ServiciosRESTCarburantes/PreciosCarburantes/Listados/MunicipiosPorProvincia/";
const fuelTypesEndpoint = "ServiciosRESTCarburantes/PreciosCarburantes/Listados/ProductosPetroliferos/";
const gasStationsEndpoint = "ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroMunicipioProducto/";

// DOM elements for interacting with the page
const provinceSelect = document.querySelector("#province-select");
const municipalitySelect = document.querySelector("#municipality-select");
const fuelTypeSelect = document.querySelector("#fuel-type-select");
const resultsDiv = document.querySelector("#results");
const openNowCheckbox = document.querySelector("#open-now");

// Function to reset the value and disable a dropdown select element
function resetSelectValue(selectElement) {
    selectElement.value = "";
    selectElement.disabled = true;
}

// Function to validate if all selections (province, municipality, fuel type) are made
function validateSelections() {
    const selectedProvince = provinceSelect.value;
    const selectedMunicipality = municipalitySelect.value;
    const selectedFuelType = fuelTypeSelect.value;

    // If any selection is missing, show a message and return false
    if (!selectedProvince || !selectedMunicipality || !selectedFuelType) {
        resultsDiv.textContent = "Please select a province, municipality, and fuel type to see the results.";
        return false;
    }

    // Clear the results message if all selections are made
    resultsDiv.textContent = "";
    return true;
}

// Fetch list of provinces from the API and populate the province select dropdown
fetch(base + provincesEndpoint)
    .then(response => response.text())
    .then(data => {
        const provinces = JSON.parse(data);
        provinces.forEach(province => {
            const option = document.createElement("option");
            option.value = province.IDPovincia; // Set province ID as value
            option.textContent = province.Provincia; // Set province name as display text
            provinceSelect.appendChild(option); // Add option to the select element
        });
    })
    .catch(error => console.error("Error getting provinces:", error));

// Event listener for when the province selection changes
provinceSelect.addEventListener("change", () => {
    const provinceId = provinceSelect.value;

    // Clear and reset the municipality and fuel type selects
    municipalitySelect.innerHTML = '<option value="" disabled selected>Select a municipality</option>';
    
    resetSelectValue(municipalitySelect);
    resetSelectValue(fuelTypeSelect);
    resultsDiv.innerHTML = "";

    if (!provinceId) return; // If no province is selected, return

    // Fetch municipalities for the selected province
    fetch(base + municipalitiesEndpoint + provinceId)
        .then(response => response.text())
        .then(data => {
            const municipalities = JSON.parse(data);
            municipalities.forEach(municipality => {
                const option = document.createElement("option");
                option.value = municipality.IDMunicipio; // Set municipality ID as value
                option.textContent = municipality.Municipio; // Set municipality name as display text
                municipalitySelect.appendChild(option); // Add option to the municipality select
            });
            municipalitySelect.disabled = false; // Enable municipality select

            // Validate selections to check if we can display results
            validateSelections();
        })
        .catch(error => console.error("Error when obtaining municipalities:", error));
});

// Event listener for when the municipality selection changes
municipalitySelect.addEventListener("change", () => {
    resetSelectValue(fuelTypeSelect); // Reset fuel type select
    resultsDiv.innerHTML = "";

    if (municipalitySelect.value) {
        fuelTypeSelect.disabled = false; // Enable fuel type select if municipality is selected
    }

    validateSelections(); // Validate the selections again
});

// Fetch list of fuel types from the API and populate the fuel type select dropdown
fetch(base + fuelTypesEndpoint)
    .then(response => response.text())
    .then(data => {
        const fuelTypes = JSON.parse(data);
        fuelTypes.forEach(fuelType => {
            const option = document.createElement("option");
            option.value = fuelType.IDProducto; // Set fuel type ID as value
            option.textContent = fuelType.NombreProducto; // Set fuel type name as display text
            fuelTypeSelect.appendChild(option); // Add option to the fuel type select
        });
    })
    .catch(error => console.error("Error getting fuel types:", error));

// Event listener for when the fuel type selection changes
fuelTypeSelect.addEventListener("change", () => {
    // If selections are valid, fetch and display gas stations
    if (validateSelections()) {
        fetchAndDisplayStations();
    }
});

// Event listener for the "Open Now" checkbox change
openNowCheckbox.addEventListener("change", () => {
    // If selections are valid, fetch and display gas stations
    if (validateSelections()) {
        fetchAndDisplayStations();
    }
});

// Function to fetch and display gas stations based on the selected municipality and fuel type
function fetchAndDisplayStations() {
    const selectedMunicipality = municipalitySelect.value;
    const selectedFuelType = fuelTypeSelect.value;

    // If any selection is invalid, do not proceed
    if (!validateSelections()) {
        return;
    }

    const queryUrl = `${base + gasStationsEndpoint}${selectedMunicipality}/${selectedFuelType}`;

    // Fetch the gas stations based on the query URL
    fetch(queryUrl)
        .then(response => response.text())
        .then(data => {
            const gasStations = JSON.parse(data).ListaEESSPrecio;

            // If no gas stations found, display a message
            if (!gasStations || gasStations.length === 0) {
                resultsDiv.textContent = "No gas stations found for the selected criteria.";
                return;
            }

            // Display the results
            displayResults(gasStations, selectedFuelType);
        })
        .catch(error => console.error("Error fetching gas stations:", error));
}

// Function to display the fetched gas stations
function displayResults(stations) {
    resultsDiv.innerHTML = "";

    if (stations.length === 0) {
        resultsDiv.textContent = "No gas stations found for the selected criteria.";
        return;
    }

    // Check if the "Open Now" checkbox is checked
    const showOpenOnly = openNowCheckbox.checked;

    // Filter stations if the "Open Now" option is selected
    const filteredStations = showOpenOnly ? stations.filter(station => isStationOpen(station.Horario)) : stations;

    // Loop through each filtered gas station and display its details
    filteredStations.forEach(station => {
        const stationDiv = document.createElement("div");
        stationDiv.className = "station";

            stationDiv.innerHTML = `
                <p><strong>Address:</strong> ${station.Dirección}</p>
                <p><strong>Locality:</strong> ${station.Localidad}</p>
                <p><strong>Province:</strong> ${station.Provincia}</p>
                <p><strong>Schedule:</strong> ${station.Horario}</p>
                <p><strong>Price:</strong> ${station.PrecioProducto} €</p>
            `;
            resultsDiv.appendChild(stationDiv); // Append the station info to the results
    });

    // If no stations to display, show a message
    if (filteredStations.length === 0) {
        resultsDiv.textContent = "No gas stations found for the selected criteria.";
    }
}

// Function to check if a station is open based on its schedule
function isStationOpen(schedule) {
    if (schedule === "L-D: 24H") return true; // If the station is open 24 hours, return true
    const now = new Date(); // Get current date and time
    const currentHour = now.getHours(); // Get current hour
    const currentDay = now.getDay(); // Get current day (0-6, where 0 = Sunday)

    const days = schedule.split(":")[0].trim(); // Extract days of the week the station is open
    const hours = schedule.split(":")[1].trim(); // Extract opening hours
    const [startHour, endHour] = hours.split("-").map(time => parseInt(time.split(":")[0])); // Parse start and end hours

    // Check if the station is open based on the current time and schedule
    if (days === "L-D") {
        return currentHour >= startHour && currentHour < endHour;
    } else if (days.includes("L-V") && currentDay >= 1 && currentDay <= 5) {
        return currentHour >= startHour && currentHour < endHour;
    } else if (days.includes("S") && currentDay === 6) {
        return currentHour >= startHour && currentHour < endHour;
    } else if (days.includes("D") && currentDay === 0) {
        return currentHour >= startHour && currentHour < endHour;
    }

    return false; // If none of the conditions are met, the station is closed
}