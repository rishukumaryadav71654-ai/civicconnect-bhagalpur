// ======================================================
// CivicConnect Banka
// public/script.js
// ======================================================

let map = null;
let marker = null;
let userProvidedLocation = false;
let complaintReceiptData = null;

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

    setupPhotoSecurityNotice()

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
        userProvidedLocation = true;

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

// ======================================================
// GET CURRENT LOCATION - HIGH ACCURACY
// ======================================================

function getCurrentLocation() {

    const button =
        document.getElementById("currentLocationBtn");

    const status =
        document.getElementById("locationStatus");

    if (!navigator.geolocation) {

        showLocationError(
            "इस browser में location service available नहीं है।"
        );

        return;
    }

    button.disabled = true;

    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Accurate location मिल रही है...
    `;

    if (status) {

        status.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            GPS से सबसे accurate location प्राप्त की जा रही है...
        `;

    }

    let bestPosition = null;
    let watchId = null;

    const startTime = Date.now();
    const MAX_TIME = 30000;


    function handlePosition(position) {

        const accuracy =
            position.coords.accuracy;

        console.log(
            "GPS Reading:",
            position.coords.latitude,
            position.coords.longitude,
            "Accuracy:",
            accuracy,
            "meters"
        );


        // सबसे अच्छी accuracy वाली location save करें
        if (
            !bestPosition ||
            accuracy < bestPosition.coords.accuracy
        ) {

            bestPosition = position;

            console.log(
                "BEST GPS ACCURACY:",
                accuracy,
                "meters"
            );


            if (status) {

                status.innerHTML = `
                    <i class="fa-solid fa-location-crosshairs"></i>
                    GPS accuracy: ${Math.round(accuracy)} meters
                `;

            }

        }


        // बहुत अच्छी location मिल गई
        if (accuracy <= 10) {

            finishLocation();

            return;

        }


        // 30 seconds पूरे होने पर best location use करें
        if (
            Date.now() - startTime >= MAX_TIME
        ) {

            finishLocation();

        }

    }


    function finishLocation() {

        if (watchId !== null) {

            navigator.geolocation.clearWatch(
                watchId
            );

            watchId = null;

        }


        if (!bestPosition) {

            showLocationError(
                "Accurate location प्राप्त नहीं हो सकी।"
            );

            resetButton();

            return;

        }


        const lat =
            bestPosition.coords.latitude;

        const lng =
            bestPosition.coords.longitude;

        const accuracy =
            bestPosition.coords.accuracy;


        console.log(
            "================================"
        );

        console.log(
            "FINAL LOCATION"
        );

        console.log(
            "Latitude:",
            lat
        );

        console.log(
            "Longitude:",
            lng
        );

        console.log(
            "Final Accuracy:",
            accuracy,
            "meters"
        );

        console.log(
            "================================"
        );


        userProvidedLocation = true;


        // Map marker
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


        // Automatically find address
        reverseGeocode(
            lat,
            lng
        );


        if (status) {

            status.innerHTML = `
                <i class="fa-solid fa-location-dot"></i>
                Location मिली — Accuracy लगभग ${Math.round(accuracy)} meters
            `;

        }


        resetButton();

    }


    function resetButton() {

        button.disabled = false;

        button.innerHTML = `
            <i class="fa-solid fa-crosshairs"></i>
            मेरी वर्तमान location
        `;

    }


    function handleError(error) {

        console.error(
            "Geolocation error:",
            error
        );


        if (watchId !== null) {

            navigator.geolocation.clearWatch(
                watchId
            );

            watchId = null;

        }


        let message =
            "Location प्राप्त नहीं हो सकी।";


        if (error.code === 1) {

            message =
                "Location permission blocked है। Browser में इस site की Location permission Allow करें।";

        }

        else if (error.code === 2) {

            message =
                "Location उपलब्ध नहीं है। Windows Location चालू करके दोबारा कोशिश करें।";

        }

        else if (error.code === 3) {

            message =
                "Location मिलने में ज्यादा समय लग गया। दोबारा कोशिश करें।";

        }


        showLocationError(message);

        resetButton();

    }


    // लगातार GPS readings लेना
    watchId =
        navigator.geolocation.watchPosition(

            handlePosition,

            handleError,

            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000
            }

        );


    // Safety timeout
    setTimeout(function () {

        if (watchId !== null) {

            finishLocation();

        }

    }, MAX_TIME + 1000);

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
            userProvidedLocation = true;


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
            encodeURIComponent(lng) +
            "&zoom=18" +
            "&addressdetails=1";


        const response =
            await fetch(url);


        if (!response.ok) {

            console.error(
                "Reverse geocoding failed:",
                response.status
            );

            return;

        }


        const data =
            await response.json();


        console.log(
            "REVERSE GEOCODE RESULT:",
            data
        );


        if (
            !data ||
            !data.address
        ) {

            return;

        }


        const a =
            data.address;


        /*
         * जितनी useful location information उपलब्ध है,
         * उसे priority के हिसाब से collect करेंगे।
         */

        const parts = [];


        // Building / house
        if (a.house_number) {

            parts.push(
                a.house_number
            );

        }


        if (a.building) {

            parts.push(
                a.building
            );

        }


        // Road / street
        if (a.road) {

            parts.push(
                a.road
            );

        }


        // Nearby locality
        if (a.neighbourhood) {

            parts.push(
                a.neighbourhood
            );

        }

        else if (a.suburb) {

            parts.push(
                a.suburb
            );

        }

        else if (a.village) {

            parts.push(
                a.village
            );

        }


        // Town / city
        if (a.town) {

            parts.push(
                a.town
            );

        }

        else if (a.city) {

            parts.push(
                a.city
            );

        }

        else if (a.municipality) {

            parts.push(
                a.municipality
            );

        }


        // District
        if (a.county) {

            parts.push(
                a.county
            );

        }


        // State
        if (a.state) {

            parts.push(
                a.state
            );

        }


        // Country
        if (a.country) {

            parts.push(
                a.country
            );

        }


        /*
         * Duplicate values हटाएँ
         */

        const uniqueParts =
            [...new Set(parts)];


        let readableAddress =
            uniqueParts.join(", ");


        /*
         * अगर structured address उपलब्ध नहीं है,
         * तो Nominatim का पूरा display_name इस्तेमाल करें।
         */

        if (
            !readableAddress &&
            data.display_name
        ) {

            readableAddress =
                data.display_name;

        }


        const address =
            document.getElementById(
                "address"
            );


        if (
            address &&
            readableAddress
        ) {

            address.value =
                readableAddress;

        }


        console.log(
            "AUTO LOCATION ADDRESS:",
            readableAddress
        );


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
if (!otpVerified) {

    alert(
        "कृपया पहले mobile number का OTP verify करें।"
    );

    return;
}
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


   
    const submitButton =
        document.getElementById(
            "submitComplaintBtn"
        );


    const message =
        document.getElementById(
            "complaintMessage"
        );
        console.log("USER PROVIDED LOCATION:", userProvidedLocation);
        if (!userProvidedLocation) {

    message.innerHTML =
        `
        <div class="error">
            📍 Please provide your location before submitting the complaint.
        </div>
        `;

    return;
}


    submitButton.disabled = true;

    submitButton.innerHTML =
        `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Complaint submit हो रही है...
        `;


    try {
        const photoInput = document.getElementById("complaintPhoto");

const formData = new FormData();

formData.append("name", name);
formData.append("phone", mobile);
formData.append("category", category);
formData.append("description", description);
formData.append("location", address);
formData.append("latitude", Number(latitude));
formData.append("longitude", Number(longitude));

if (photoInput && photoInput.files.length > 0) {
    formData.append("complaintPhoto", photoInput.files[0]);
}

        const response =
            await fetch(
                "/api/complaints",
                {
                    method: "POST",

                    

                   body: formData

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
             complaintReceiptData = {
    complaintId: complaintId,
    name: name,
    mobile: mobile,
    category: category,
    description: description,
    address: address,
    latitude: latitude,
    longitude: longitude,
    date: new Date().toLocaleString("en-IN"),
    photoFile:
        photoInput && photoInput.files.length > 0
            ? photoInput.files[0]
            : null
};


        message.innerHTML =
    `
    <div class="success">

        <strong>
            ✅ शिकायत सफलतापूर्वक दर्ज हो गई!
        </strong>

        <br><br>

        Complaint ID:
        <strong>
            ${complaintId}
        </strong>

        <br><br>

        इस ID को सुरक्षित रखें।
        इससे बाद में शिकायत track कर सकते हैं।

        <br><br>

        <button
            type="button"
            onclick="downloadComplaintReceipt()"
            style="
                padding: 9px 15px;
                border: 1px solid #198754;
                border-radius: 7px;
                background: #198754;
                color: white;
                cursor: pointer;
                font-weight: 600;
            "
        >
            📄 Download Form
        </button>

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
 async function downloadComplaintReceipt() {

    if (!complaintReceiptData) {
        alert("Complaint details उपलब्ध नहीं हैं।");
        return;
    }

    try {

        const jsPDF = window.jspdf.jsPDF;

        const pdf = new jsPDF();

        let y = 20;

       // Header Logo
const logo = new Image();

logo.src = "/civicconnect-logo.png";

await new Promise((resolve, reject) => {

    logo.onload = resolve;
    logo.onerror = reject;

});

pdf.addImage(
    logo,
    "PNG",
    82,
    12,
    46,
    24
);

y = 48;

// CivicConnect title
pdf.setFontSize(22);
pdf.setTextColor(25, 135, 84);

pdf.text(
    "CivicConnect",
    105,
    y,
    {
        align: "center"
    }
);

y += 8;

pdf.setFontSize(12);
pdf.setTextColor(80, 80, 80);

pdf.text(
    "Official Complaint Receipt",
    105,
    y,
    {
        align: "center"
    }
);

y += 12;

        pdf.setDrawColor(25, 135, 84);
        pdf.line(15, y, 195, y);

        y += 12;

        // Complaint ID
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text(
            "Complaint ID:",
            20,
            y
        );

        pdf.setFont("helvetica", "bold");

        pdf.text(
            String(complaintReceiptData.complaintId),
            65,
            y
        );

        pdf.setFont("helvetica", "normal");

        y += 10;

        // Date
        pdf.setFontSize(11);

        pdf.text(
            "Date & Time:",
            20,
            y
        );

        pdf.text(
            String(complaintReceiptData.date),
            65,
            y
        );

        y += 12;

        // Details
        pdf.setFont("helvetica", "bold");
        pdf.text("Complainant Details", 20, y);

        pdf.setFont("helvetica", "normal");

        y += 9;

        pdf.text(
            "Name:",
            20,
            y
        );

        pdf.text(
            String(complaintReceiptData.name || ""),
            65,
            y
        );

        y += 8;

        pdf.text(
            "Mobile:",
            20,
            y
        );

        pdf.text(
            String(complaintReceiptData.mobile || ""),
            65,
            y
        );

        y += 8;

        pdf.text(
            "Category:",
            20,
            y
        );

        pdf.text(
            String(complaintReceiptData.category || ""),
            65,
            y
        );

        y += 12;

        // Location
        pdf.setFont("helvetica", "bold");
        pdf.text("Complaint Location", 20, y);

        pdf.setFont("helvetica", "normal");

        y += 9;

        const addressLines =
            pdf.splitTextToSize(
                String(
                    complaintReceiptData.address ||
                    "Not provided"
                ),
                155
            );

        pdf.text(
            addressLines,
            20,
            y
        );

        y += addressLines.length * 6 + 8;

        // Coordinates
        pdf.text(
            "Latitude:",
            20,
            y
        );

        pdf.text(
            String(complaintReceiptData.latitude || ""),
            65,
            y
        );

        y += 8;

        pdf.text(
            "Longitude:",
            20,
            y
        );

        pdf.text(
            String(complaintReceiptData.longitude || ""),
            65,
            y
        );

        y += 12;

        // Description
        pdf.setFont("helvetica", "bold");
        pdf.text("Complaint Description", 20, y);

        pdf.setFont("helvetica", "normal");

        y += 9;

        const descriptionLines =
            pdf.splitTextToSize(
                String(
                    complaintReceiptData.description ||
                    ""
                ),
                170
            );

        pdf.text(
            descriptionLines,
            20,
            y
        );

        y += descriptionLines.length * 6 + 15;
                // Complaint Photo
        if (complaintReceiptData.photoFile) {

            y += 5;

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0);

            pdf.text(
                "Complaint Photo",
                20,
                y
            );

            y += 7;

            const photoData =
                await new Promise((resolve, reject) => {

                    const reader =
                        new FileReader();

                    reader.onload = () => {
                        resolve(reader.result);
                    };

                    reader.onerror = reject;

                    reader.readAsDataURL(
                        complaintReceiptData.photoFile
                    );
                });

            const imageProps =
                pdf.getImageProperties(
                    photoData
                );

            const maxWidth = 170;
            const maxHeight = 90;

            let imgWidth =
                maxWidth;

            let imgHeight =
                (imageProps.height / imageProps.width)
                * imgWidth;

            if (imgHeight > maxHeight) {

                imgHeight =
                    maxHeight;

                imgWidth =
                    (imageProps.width / imageProps.height)
                    * imgHeight;
            }

            // New page if necessary
            if (y + imgHeight > 275) {

                pdf.addPage();

                y = 20;
            }

            pdf.addImage(
                photoData,
                "JPEG",
                20,
                y,
                imgWidth,
                imgHeight
            );

            y += imgHeight + 10;
        }

        // Footer
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, y, 190, y);

        y += 8;

        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);

        pdf.text(
            "Please keep this receipt safe for future tracking and reference.",
            20,
            y
        );

        // Download
        pdf.save(
            `CivicConnect-${complaintReceiptData.complaintId}.pdf`
        );

    }

    catch (error) {

        console.error(
            "PDF generation error:",
            error
        );

        alert(
            "PDF बनाने में समस्या आई। Console में error देखें।"
        );

    }
}

function setupPhotoSecurityNotice() {
    const photoInput =
        document.getElementById("complaintPhoto");

    const uploadButton =
        document.getElementById("photoUploadBtn");

    const notice =
        document.getElementById("photoSecurityNotice");

    const continueButton =
        document.getElementById("continuePhotoUpload");

    if (
        !photoInput ||
        !uploadButton ||
        !notice ||
        !continueButton
    ) {
        return;
    }

    uploadButton.addEventListener("click", () => {
        notice.style.display = "block";
    });

    continueButton.addEventListener("click", () => {
        photoInput.click();
    });
    photoInput.addEventListener("change", () => {

    if (photoInput.files.length > 0) {

        uploadButton.innerHTML =
            `📷 ${photoInput.files[0].name}`;

    } else {

        uploadButton.innerHTML =
            `📷 फोटो अपलोड करें`;

    }

});
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
                const trackingMobile =
    document.getElementById(
        "trackingMobile"
    ).value.trim();
    if (!/^[6-9]\d{9}$/.test(trackingMobile)) {

    alert(
        "कृपया सही 10-digit mobile number enter करें।"
    );

    return;
}


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
        `/api/complaints/${encodeURIComponent(trackingId)}?mobile=${encodeURIComponent(trackingMobile)}`
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
                            <div class="admin-complaint-photo">

    <strong>Complaint Photo:</strong>

    ${
        complaint.image_url
            ? `
                <br>

                <a
                    href="${complaint.image_url}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img
                        src="${complaint.image_url}"
                        alt="Complaint Photo"
                        style="
                            max-width: 300px;
                            width: 100%;
                            margin-top: 10px;
                            border-radius: 10px;
                            display: block;
                            cursor: pointer;
                        "
                    >
                </a>
              `
            : `
                <p>No photo uploaded.</p>
              `
    }

</div>

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

<div class="admin-complaint-photo">

    <strong>Complaint Photo:</strong>

    ${
        complaint.image_url
            ? `
                <br>
                <img
                    src="${complaint.image_url}"
                    alt="Complaint Photo"
                    onclick="window.open('${complaint.image_url}', '_blank')"
                    style="
                        max-width: 300px;
                        width: 100%;
                        margin-top: 10px;
                        border-radius: 10px;
                        display: block;
                    "
                >
              `
            : `
                <p>No photo uploaded.</p>
              `
    }

</div>

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
        setupOtpModeControl();
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
function setupOtpModeControl() {

    const control =
        document.getElementById("otpModeControl");

    if (!control) return;
    fetch("/api/admin/otp-mode", {
    headers: {
        "Authorization":
            `Bearer ${sessionStorage.getItem("adminToken")}`
    }
})
.then(response => response.json())
.then(data => {

    if (
        data.mode === "fixed" ||
        data.mode === "2factor"
    ) {
        const selected =
            document.querySelector(
                `input[name="otpMode"][value="${data.mode}"]`
            );

        if (selected) {
            selected.checked = true;
        }
    }

})
.catch(error => {
    console.error(
        "Could not load OTP mode:",
        error
    );
});
    if (control.dataset.initialized === "true") return;
control.dataset.initialized = "true";

    control.style.display = "block";

    const modes =
        document.querySelectorAll(
            'input[name="otpMode"]'
        );
        control.dataset.initialized = "true";

    modes.forEach(mode => {

        mode.addEventListener("change", async () => {

            const selectedMode =
                mode.value;
                console.log("OTP CHANGE EVENT:", selectedMode);

            const password =
                prompt(
                    "OTP Mode बदलने के लिए दूसरा password डालें:"
                );

            if (password === null) {
    document.querySelector(
        `input[name="otpMode"][value="${selectedMode === "fixed" ? "2factor" : "fixed"}"]`
    ).checked = true;

    return;
}

            try {

                const token =
                    sessionStorage.getItem(
                        "adminToken"
                    );

                const response =
                    await fetch(
                        "/api/admin/otp-mode-password",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({
                                password,
                                mode: selectedMode
                            })
                        }
                    );

                const result =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.error ||
                        "Wrong password"
                    );
                }

                alert(
                    selectedMode === "fixed"
                        ? "Fixed OTP mode selected."
                        : "2Factor SMS mode selected."
                );

            } catch (error) {

                alert(
                    "❌ " +
                    error.message
                );

               document.querySelector(
    `input[name="otpMode"][value="${selectedMode === "fixed" ? "2factor" : "fixed"}"]`
).checked = true;
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
// ==========================================
// TEST OTP SYSTEM
// ==========================================

let otpVerified = false;


// =========================
// REAL SMS OTP - SEND
// =========================

document
.getElementById("sendOtpBtn")
.addEventListener("click", async () => {

    const mobile =
        document.getElementById("mobile").value.trim();

    const otpMessage =
        document.getElementById("otpMessage");

    const otpBox =
        document.getElementById("otpBox");


    // Mobile validation
    if (!/^[6-9]\d{9}$/.test(mobile)) {

        otpMessage.textContent =
            "कृपया सही 10 digit mobile number डालें।";

        otpMessage.style.color = "red";

        return;
    }


    otpVerified = false;
    const sendOtpBtn =
    document.getElementById("sendOtpBtn");

sendOtpBtn.disabled = true;


    otpMessage.textContent =
        "OTP भेजा जा रहा है...";

    otpMessage.style.color = "green";


    try {

        const response =
            await fetch("/api/send-otp", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    mobile
                })

            });


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "OTP भेजने में समस्या हुई।"
            );

        }


        otpBox.style.display = "block";


        otpMessage.textContent =
            "OTP आपके mobile number पर भेज दिया गया है।";

        otpMessage.style.color = "green";


    } catch (error) {

        console.error(
            "OTP send error:",
            error
        );


        otpMessage.textContent =
            error.message ||
            "OTP भेजने में समस्या हुई।";

        otpMessage.style.color = "red";

    }

});


// =========================
// REAL SMS OTP - VERIFY
// =========================

document
.getElementById("verifyOtpBtn")
.addEventListener("click", async () => {

    const mobile =
        document.getElementById("mobile").value.trim();

    const enteredOTP =
        document.getElementById("otp").value.trim();

    const otpMessage =
        document.getElementById("otpMessage");


    if (!enteredOTP) {

        otpMessage.textContent =
            "OTP डालें।";

        otpMessage.style.color = "red";

        return;
    }


    if (!/^\d{6}$/.test(enteredOTP)) {

        otpMessage.textContent =
            "6 digit OTP डालें।";

        otpMessage.style.color = "red";

        return;
    }


    otpMessage.textContent =
        "OTP verify हो रहा है...";

    otpMessage.style.color = "green";


    try {

        const response =
            await fetch("/api/verify-otp", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    mobile,

                    otp: enteredOTP

                })

            });


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "OTP गलत है।"
            );

        }


        otpVerified = true;
        const verifyBtn =
    document.getElementById("verifyOtpBtn");

verifyBtn.disabled = true;
verifyBtn.textContent = "✓ OTP Verified";


        otpMessage.textContent =
            "✓ Mobile number verified.";

        otpMessage.style.color = "green";


    } catch (error) {

        otpVerified = false;


        console.error(
            "OTP verify error:",
            error
        );


        otpMessage.textContent =
            error.message ||
            "OTP verification failed.";

        otpMessage.style.color = "red";

    }

});