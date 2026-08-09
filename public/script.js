// ======================================================
// CivicConnect Banka
// public/script.js
// ======================================================

let map = null;
let marker = null;

// Banka, Bihar
const DEFAULT_LAT = 24.8877;
const DEFAULT_LNG = 86.9220;


// ======================================================
// PAGE LOAD
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    initializeMap();

    setupCurrentLocation();

    setupLocationSearch();

    setupComplaintForm();

    setupTracking();

    setupAdmin();

});


// ======================================================
// MAP
// ======================================================

function initializeMap() {

    const mapElement = document.getElementById("map");

    if (!mapElement) {
        console.error("Map element not found.");
        return;
    }

    if (typeof L === "undefined") {
        console.error("Leaflet library not loaded.");
        return;
    }

    map = L.map("map").setView(
        [DEFAULT_LAT, DEFAULT_LNG],
        13
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    setMarker(
        DEFAULT_LAT,
        DEFAULT_LNG,
        "Banka, Bihar"
    );

    updateCoordinates(
        DEFAULT_LAT,
        DEFAULT_LNG
    );


    // Map click
    map.on("click", function (event) {

        const lat = event.latlng.lat;
        const lng = event.latlng.lng;

        setMarker(
            lat,
            lng,
            "Selected Location"
        );

        updateCoordinates(lat, lng);

        reverseGeocode(lat, lng);

    });


    // Important for maps inside responsive layouts
    setTimeout(() => {
        map.invalidateSize();
    }, 300);

}


// ======================================================
// MARKER
// ======================================================

function setMarker(
    lat,
    lng,
    text = "Selected Location"
) {

    if (!map) return;


    if (marker) {

        marker.setLatLng([
            lat,
            lng
        ]);

    } else {

        marker = L.marker(
            [lat, lng],
            {
                draggable: true
            }
        ).addTo(map);


        // Marker drag
        marker.on(
            "dragend",
            function () {

                const position =
                    marker.getLatLng();

                updateCoordinates(
                    position.lat,
                    position.lng
                );

                reverseGeocode(
                    position.lat,
                    position.lng
                );

            }
        );

    }


    marker
        .bindPopup(text)
        .openPopup();


    map.setView(
        [lat, lng],
        Math.max(
            map.getZoom(),
            15
        )
    );

}


// ======================================================
// COORDINATES
// ======================================================

function updateCoordinates(
    lat,
    lng
) {

    const latitude =
        document.getElementById(
            "latitude"
        );

    const longitude =
        document.getElementById(
            "longitude"
        );


    if (latitude) {

        latitude.value =
            Number(lat).toFixed(7);

    }


    if (longitude) {

        longitude.value =
            Number(lng).toFixed(7);

    }


    // Visible coordinate display

    const latitudeDisplay =
        document.getElementById(
            "latitudeDisplay"
        );

    const longitudeDisplay =
        document.getElementById(
            "longitudeDisplay"
        );


    if (latitudeDisplay) {

        latitudeDisplay.textContent =
            Number(lat).toFixed(6);

    }


    if (longitudeDisplay) {

        longitudeDisplay.textContent =
            Number(lng).toFixed(6);

    }


    const status =
        document.getElementById(
            "locationStatus"
        );


    if (status) {

        status.innerHTML =
            `
            <i class="fa-solid fa-location-dot"></i>
            Location selected —
            ${Number(lat).toFixed(6)},
            ${Number(lng).toFixed(6)}
            `;

    }

}


// ======================================================
// CURRENT LOCATION
// ======================================================

function setupCurrentLocation() {

    const button =
        document.getElementById(
            "currentLocationBtn"
        );


    if (!button) {

        console.error(
            "Current location button not found."
        );

        return;

    }


    button.addEventListener(
        "click",
        getCurrentLocation
    );

}


// ======================================================
// GET CURRENT LOCATION
// ======================================================

function getCurrentLocation() {

    const button =
        document.getElementById(
            "currentLocationBtn"
        );


    if (!navigator.geolocation) {

        showLocationError(
            "इस browser में location service available नहीं है।"
        );

        return;

    }


    button.disabled = true;

    button.innerHTML =
        `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Location मिल रही है...
        `;


    const status =
        document.getElementById(
            "locationStatus"
        );


    if (status) {

        status.innerHTML =
            `
            <i class="fa-solid fa-spinner fa-spin"></i>
            आपकी current location प्राप्त की जा रही है...
            `;

    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            console.log(
                "Current location:",
                position.coords.latitude,
                position.coords.longitude
            );


            const lat =
                position.coords.latitude;

            const lng =
                position.coords.longitude;


            // Move map
            setMarker(
                lat,
                lng,
                "📍 आपकी वर्तमान location"
            );


            // Save coordinates
            updateCoordinates(
                lat,
                lng
            );


            // Find address
            reverseGeocode(
                lat,
                lng
            );


            button.disabled = false;

            button.innerHTML =
                `
                <i class="fa-solid fa-crosshairs"></i>
                मेरी वर्तमान location
                `;

        },


        function (error) {

            console.error(
                "Geolocation error:",
                error
            );


            let message =
                "Location प्राप्त नहीं हो सकी।";


            if (error.code === 1) {

                message =
                    "Location permission blocked है। Browser में इस site की Location permission Allow करें।";

            }

            else if (error.code === 2) {

                message =
                    "आपकी location उपलब्ध नहीं है। GPS/Location चालू करके दोबारा कोशिश करें।";

            }

            else if (error.code === 3) {

                message =
                    "Location मिलने में ज्यादा समय लग गया। दोबारा कोशिश करें।";

            }


            showLocationError(message);


            button.disabled = false;

            button.innerHTML =
                `
                <i class="fa-solid fa-crosshairs"></i>
                मेरी वर्तमान location
                `;

        },


        {
            enableHighAccuracy: true,

            timeout: 20000,

            maximumAge: 0

        }

    );

}


// ======================================================
// LOCATION ERROR
// ======================================================

function showLocationError(message) {

    const status =
        document.getElementById(
            "locationStatus"
        );


    if (status) {

        status.innerHTML =
            `
            <i class="fa-solid fa-circle-exclamation"></i>
            ${message}
            `;

    }


    alert(message);

}


// ======================================================
// LOCATION SEARCH
// ======================================================

function setupLocationSearch() {

    const searchButton =
        document.getElementById(
            "searchLocationBtn"
        );


    const searchInput =
        document.getElementById(
            "locationSearch"
        );


    if (!searchButton || !searchInput) {

        return;

    }


    searchButton.addEventListener(
        "click",
        searchLocation
    );


    searchInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                searchLocation();

            }

        }
    );

}


// ======================================================
// SEARCH
// ======================================================

async function searchLocation() {

    const input =
        document.getElementById(
            "locationSearch"
        );


    const query =
        input.value.trim();


    if (!query) {

        alert(
            "पहले कोई location लिखें।"
        );

        return;

    }


    const button =
        document.getElementById(
            "searchLocationBtn"
        );


    button.disabled = true;

    button.innerText =
        "Searching...";


    try {

        const url =
            "https://nominatim.openstreetmap.org/search" +
            "?format=json" +
            "&limit=1" +
            "&q=" +
            encodeURIComponent(query);


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Location search failed."
            );

        }


        const results =
            await response.json();
        console.log("ACTUAL API RESULT:", results);    


        if (
            !results ||
            results.length === 0
        ) {

            alert(
                "Location नहीं मिली।"
            );

            return;

        }


        const result =
            results[0];


        const lat =
            parseFloat(result.lat);

        const lng =
            parseFloat(result.lon);


        setMarker(
            lat,
            lng,
            result.display_name
        );


        updateCoordinates(
            lat,
            lng
        );


        const address =
            document.getElementById(
                "address"
            );


        if (address) {

            address.value =
                result.display_name;

        }


    }

    catch (error) {

        console.error(
            "Location search error:",
            error
        );


        alert(
            "Location search में problem आई।"
        );

    }

    finally {

        button.disabled = false;

        button.innerText =
            "खोजें";

    }

}


// ======================================================
// REVERSE GEOCODING
// ======================================================

async function reverseGeocode(
    lat,
    lng
) {

    try {

        const url =
            "https://nominatim.openstreetmap.org/reverse" +
            "?format=json" +
            "&lat=" +
            encodeURIComponent(lat) +
            "&lon=" +
            encodeURIComponent(lng);


        const response =
            await fetch(url);


        if (!response.ok) return;


        const data =
            await response.json();


        if (
            data &&
            data.display_name
        ) {

            const address =
                document.getElementById(
                    "address"
                );


            if (address) {

                address.value =
                    data.display_name;

            }

        }

    }

    catch (error) {

        console.error(
            "Reverse geocoding error:",
            error
        );

    }

}


// ======================================================
// COMPLAINT FORM
// ======================================================

function setupComplaintForm() {

    const form =
        document.getElementById(
            "complaintForm"
        );


    if (!form) {

        console.error(
            "Complaint form not found."
        );

        return;

    }


    form.addEventListener(
        "submit",
        submitComplaint
    );

}


// ======================================================
// SUBMIT COMPLAINT
// ======================================================

async function submitComplaint(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "name"
        ).value.trim();


    const mobile =
        document.getElementById(
            "mobile"
        ).value.trim();


    const category =
        document.getElementById(
            "category"
        ).value;


    const description =
        document.getElementById(
            "description"
        ).value.trim();


    const address =
        document.getElementById(
            "address"
        ).value.trim();


    const latitude =
        document.getElementById(
            "latitude"
        ).value;


    const longitude =
        document.getElementById(
            "longitude"
        ).value;


    // Validation

    if (
        !name ||
        !mobile ||
        !category ||
        !description
    ) {

        alert(
            "कृपया सभी जरूरी details भरें।"
        );

        return;

    }


    if (
        !latitude ||
        !longitude
    ) {

        alert(
            "पहले map पर complaint location select करें।"
        );

        return;

    }


    const submitButton =
        document.getElementById(
            "submitComplaintBtn"
        );


    const message =
        document.getElementById(
            "complaintMessage"
        );


    submitButton.disabled = true;

    submitButton.innerHTML =
        `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Complaint submit हो रही है...
        `;


    try {

        const response =
            await fetch(
                "/api/complaints",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name,

                        mobile,

                        category,

                        description,

                        address,

                        latitude:
                            Number(latitude),

                        longitude:
                            Number(longitude)

                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

           throw new Error(
    result.message ||
    result.error ||
    "Complaint submission failed."
);

        }


        const complaintId =
            result.id ||
            result.complaint_id ||
            result.data?.id ||
            "Generated";


        message.innerHTML =
            `
            <div class="success">

                <strong>
                    ✅ शिकायत सफलतापूर्वक दर्ज हो गई!
                </strong>

                <br>

                Complaint ID:
                <strong>
                    ${complaintId}
                </strong>

                <br>

                इस ID को सुरक्षित रखें।
                इससे बाद में शिकायत track कर सकते हैं।

            </div>
            `;


        // Reset form
        document.getElementById(
            "complaintForm"
        ).reset();


        // Reset map to Banka
        setMarker(
            DEFAULT_LAT,
            DEFAULT_LNG,
            "Banka, Bihar"
        );


        updateCoordinates(
            DEFAULT_LAT,
            DEFAULT_LNG
        );


    }

    catch (error) {

        console.error(
            "Complaint submission error:",
            error
        );


        message.innerHTML =
            `
            <div class="error">

                ❌ Complaint submit नहीं हुई।

                <br>

                ${error.message}

            </div>
            `;

    }

    finally {

        submitButton.disabled = false;

        submitButton.innerHTML =
            `
            <i class="fa-solid fa-paper-plane"></i>
            शिकायत जमा करें
            `;

    }

}


// ======================================================
// TRACKING
// ======================================================

function setupTracking() {

    const form =
        document.getElementById(
            "trackingForm"
        );


    if (!form) return;


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const trackingId =
                document.getElementById(
                    "trackingId"
                ).value.trim();


            if (!trackingId) {

                alert(
                    "Complaint ID enter करें।"
                );

                return;

            }


            const resultBox =
                document.getElementById(
                    "trackingResult"
                );


            resultBox.innerHTML =
                "🔎 Searching...";


            try {

                const response =
                    await fetch(
                        `/api/complaints/${encodeURIComponent(trackingId)}`
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Complaint not found"
                    );

                }


                const complaint =
                    result.data ||
                    result;
                  console.log(
                      "TRACKING RESULT:",
                        result
                  );  


                resultBox.innerHTML =
                    `
                    <div class="tracking-card">

                        <h3>
                            📋 Complaint Details
                        </h3>

                        <p>
                            <strong>ID:</strong>
                            ${complaint.id ?? trackingId}
                        </p>

                        <p>
                            <strong>Category:</strong>
                            ${complaint.category ?? "-"}
                        </p>

                        <p>
                            <strong>Status:</strong>
                            ${complaint.status ?? "Pending"}
                        </p>
                        <p>
                            <strong>Assigned To:</strong>
                            ${complaint.assigned_to ?? "Not assigned yet"}
                            
                            
                        </p>

                        <p>
                            <strong>Description:</strong>
                            ${complaint.description ?? "-"}
                        </p>

                    </div>
                    `;

            }

            catch (error) {

                console.error(error);

                resultBox.innerHTML =
                    `
                    <div class="error">
                        ❌ ${error.message}
                    </div>
                    `;

            }

        }
    );

}


// ======================================================
// ADMIN
// ======================================================

function setupAdmin() {

    const button =
        document.getElementById("adminLoginBtn");

    const resultBox =
        document.getElementById("adminResult");

    if (!button || !resultBox) return;

    button.addEventListener("click", async () => {

        const pin = prompt("Enter Admin PIN:");

        if (!pin) return;

        resultBox.innerHTML =
            "⏳ Checking admin login...";

        try {

            const response =
                await fetch("/api/admin/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        pin: pin
                    })
                });

            const result =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Login failed"
                );
            }

            // Save admin token
            sessionStorage.setItem(
                "adminToken",
                result.token
            );

            resultBox.innerHTML =
                "✅ Admin login successful. Loading complaints...";

            await loadAdminComplaints();

        } catch (error) {

            console.error(
                "Admin login error:",
                error
            );

            resultBox.innerHTML =
                `<div class="error">
                    ❌ ${error.message}
                </div>`;
        }
    });
}


// ======================================================
// LOAD ADMIN COMPLAINTS
// ======================================================

async function loadAdminComplaints() {

    const resultBox =
        document.getElementById("adminResult");

    const token =
        sessionStorage.getItem("adminToken");

    if (!token) {
        resultBox.innerHTML =
            "<p>❌ Admin login required.</p>";
        return;
    }

    resultBox.innerHTML =
        "⏳ Loading complaints...";

    try {

        const response =
            await fetch(
                "/api/admin/complaints",
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Could not load complaints"
            );
        }

        const complaints =
            Array.isArray(result)
                ? result
                : (
                    result.data ||
                    result.complaints ||
                    []
                );

        if (complaints.length === 0) {

            resultBox.innerHTML =
                "<p>📭 No complaints found.</p>";

            return;
        }

        resultBox.innerHTML = `

            <div class="admin-controls">

                <input
                    type="text"
                    id="adminComplaintSearch"
                    placeholder="Complaint ID se search karein"
                >

                <button
                    type="button"
                    id="adminLogoutBtn"
                >
                    🚪 Logout
                </button>

            </div>

            <div id="adminComplaintList">

                ${complaints.map(
                    complaint => `

                    <div
                        class="admin-complaint"
                        data-complaint-id="${complaint.id}"
                    >

                        <h3>
                            Complaint #${complaint.id ?? "-"}
                        </h3>

                        <p>
                            <strong>Name:</strong>
                            ${complaint.name ?? "-"}
                        </p>

                        <p>
                            <strong>Mobile:</strong>
                            ${complaint.phone ?? "-"}
                        </p>

                        <p>
                            <strong>Category:</strong>
                            ${complaint.category ?? "-"}
                        </p>

                        <p>
                            <strong>Location:</strong>
                            ${complaint.location ?? "-"}
                        </p>

                        <p>
                            <strong>Description:</strong>
                            ${complaint.description ?? "-"}
                        </p>

                        <p>
                            <strong>Date:</strong>
                            ${complaint.created ?? "-"}
                        </p>
                        <p>
    <strong>Assigned To:</strong>

    <select
        class="admin-assigned"
        data-id="${complaint.id}"
    >

        <option value="">
            -- Select Department / Officer --
        </option>

        <option value="Executive Engineer - RWD"
            ${complaint.assigned_to === "Executive Engineer - RWD" ? "selected" : ""}>
            Executive Engineer - RWD (Road)
        </option>

        <option value="Executive Engineer - PHED"
            ${complaint.assigned_to === "Executive Engineer - PHED" ? "selected" : ""}>
            Executive Engineer - PHED (Water Supply)
        </option>

        <option value="Executive Engineer - Electricity"
            ${complaint.assigned_to === "Executive Engineer - Electricity" ? "selected" : ""}>
            Executive Engineer - Electricity
        </option>

        <option value="Executive Engineer - Bridge Construction"
            ${complaint.assigned_to === "Executive Engineer - Bridge Construction" ? "selected" : ""}>
            Executive Engineer - Bridge Construction
        </option>

        <option value="Executive Engineer - Irrigation"
            ${complaint.assigned_to === "Executive Engineer - Irrigation" ? "selected" : ""}>
            Executive Engineer - Irrigation / Drainage
        </option>

        <option value="Superintendent of Police"
            ${complaint.assigned_to === "Superintendent of Police" ? "selected" : ""}>
            Superintendent of Police (Public Safety)
        </option>

        <option value="District Forest Officer"
            ${complaint.assigned_to === "District Forest Officer" ? "selected" : ""}>
            District Forest Officer
        </option>

        <option value="District Agriculture Officer"
            ${complaint.assigned_to === "District Agriculture Officer" ? "selected" : ""}>
            District Agriculture Officer
        </option>

        <option value="Civil Surgeon"
            ${complaint.assigned_to === "Civil Surgeon" ? "selected" : ""}>
            Civil Surgeon (Health)
        </option>

        <option value="District Animal Husbandry Officer"
            ${complaint.assigned_to === "District Animal Husbandry Officer" ? "selected" : ""}>
            District Animal Husbandry Officer
        </option>

        <option value="District Transport Officer"
            ${complaint.assigned_to === "District Transport Officer" ? "selected" : ""}>
            District Transport Officer
        </option>

        <option value="Revenue Authority"
            ${complaint.assigned_to === "Revenue Authority" ? "selected" : ""}>
            Revenue / Land Authority
        </option>

        <option value="District Administration"
            ${complaint.assigned_to === "District Administration" ? "selected" : ""}>
            District Administration
        </option>

    </select>
</p>

                        <p>
                            <strong>Status:</strong>

                            <select
                                class="admin-status"
                                data-id="${complaint.id}"
                            >

                                <option value="Submitted"
                                    ${complaint.status === "Submitted" ? "selected" : ""}>
                                    Submitted
                                </option>

                                <option value="Under Review"
                                    ${complaint.status === "Under Review" ? "selected" : ""}>
                                    Under Review
                                </option>

                                <option value="Assigned"
                                    ${complaint.status === "Assigned" ? "selected" : ""}>
                                    Assigned
                                </option>

                                <option value="In Progress"
                                    ${complaint.status === "In Progress" ? "selected" : ""}>
                                    In Progress
                                </option>

                                <option value="Resolved"
                                    ${complaint.status === "Resolved" ? "selected" : ""}>
                                    Resolved
                                </option>

                            </select>

                            <button
                                type="button"
                                class="update-status-btn"
                                data-id="${complaint.id}"
                            >
                                Update Status
                            </button>

                        </p>

                    </div>

                    `
                ).join("")}

            </div>
        `;

        setupAdminSearch();
        setupAdminStatusUpdates();
        setupAdminLogout();

    } catch (error) {

        console.error(
            "Admin error:",
            error
        );

        resultBox.innerHTML =
            `<div class="error">
                ❌ ${error.message}
            </div>`;
    }
}
function setupAdminSearch() {

    const search =
        document.getElementById("adminComplaintSearch");

    if (!search) return;

    search.addEventListener("input", () => {

        const value =
            search.value.trim().toUpperCase();

        document
            .querySelectorAll(".admin-complaint")
            .forEach(card => {

                const id =
                    String(
                        card.dataset.complaintId || ""
                    ).toUpperCase();

                card.style.display =
                    !value || id.includes(value)
                        ? ""
                        : "none";
            });
    });
}


function setupAdminStatusUpdates() {

    document
        .querySelectorAll(".update-status-btn")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const id = button.dataset.id;

                const card =
                    button.closest(".admin-complaint");

                const select =
                    card.querySelector(".admin-status");

                const status = select.value;
                console.log(
    "Status:",
    status,
    "Assigned To:",
    card.querySelector(".admin-assigned").value
);

                const token =
                    sessionStorage.getItem("adminToken");

                try {

                    button.disabled = true;
                    button.textContent = "Updating...";

                    const response =
                        await fetch(
                            `/api/admin/complaints/${id}`,
                            {
                                method: "PATCH",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${token}`
                                },

                                body: JSON.stringify({
    status: status,
    assigned_to: card.querySelector(".admin-assigned").value
})
                            }
                        );

                    const result =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            result.error ||
                            "Status update failed"
                        );
                    }

                    button.textContent = "✓ Updated";

                    setTimeout(() => {
                        button.textContent =
                            "Update Status";
                    }, 1500);

                } catch (error) {

                    alert("❌ " + error.message);

                    button.textContent =
                        "Update Status";

                } finally {

                    button.disabled = false;
                }
            });
        });
}


function setupAdminLogout() {

    const button =
        document.getElementById("adminLogoutBtn");

    if (!button) return;

    button.addEventListener("click", async () => {

        const token =
            sessionStorage.getItem("adminToken");

        try {

            await fetch(
                "/api/admin/logout",
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );
        }

        sessionStorage.removeItem("adminToken");

        const resultBox =
            document.getElementById("adminResult");

        if (resultBox) {
            resultBox.innerHTML =
                "<p>✅ Admin logged out.</p>";
        }
    });
}