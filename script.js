const apiKey = 'AIzaSyA7ChXzekgIu3OxFvJM-2ktQqetuJHUpig';
let map, userMarker, placesService;


const locationElement = document.getElementById('location');
const timeElement = document.getElementById('local-time');
const placesElement = document.getElementById('nearby-places');
const mapElement = document.getElementById('map');
const refreshButton = document.getElementById('refresh-button');

// Xaritani boshlash
function initMap() {
    map = new google.maps.Map(mapElement, {
        center: { lat: 41.3111, lng: 69.2407 },
        zoom: 13,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: true,
        zoomControl: true
    });
    getUserLocation();
}

// Foydalanuvchi joylashuvini olish
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            handleLocationSuccess,
            handleLocationError
        );
    } else {
        handleLocationError({ code: 0, message: "Brauzeringiz geolokatsiyani qo'llamaydi." });
    }
}

// Muvaffaqiyatli joylashuv
function handleLocationSuccess(position) {
    const { latitude, longitude } = position.coords;
    const userLocation = { lat: latitude, lng: longitude };
    map.setCenter(userLocation);

    if (userMarker) userMarker.setMap(null);

    userMarker = new google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Sizning joylashuvingiz',
        animation: google.maps.Animation.DROP,
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(40, 40)
        }
    });
    
    updateLocationInfo(latitude, longitude);
    searchNearbyPlaces(userLocation);
}

// Joylashuvni yangilash
function updateLocationInfo(latitude, longitude) {
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=uz`)
        .then(response => response.json())
        .then(data => {
            const city = data.city || data.locality || "Noma'lum shahar";
            const country = data.countryName || "Noma'lum mamlakat";
            locationElement.innerHTML = `<strong>${city}, ${country}</strong> <small>(${latitude.toFixed(6)}, ${longitude.toFixed(6)})</small>`;
            updateLocalTime(data.timezone);
        })
        .catch(() => {
            locationElement.innerHTML = `Joylashuv ma'lumotlarini olishda xatolik.`;
            updateLocalTime();
        });
}

// Mahalliy vaqtni yangilash
function updateLocalTime(timezone) {
    const options = {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        day: 'numeric', month: 'long', year: 'numeric',
        hour12: false, timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    timeElement.innerHTML = `<strong>${new Date().toLocaleString('uz-UZ', options)}</strong>`;
    setTimeout(() => updateLocalTime(timezone), 1000);
}

// Yaqin atrofdagi joylarni qidirish
function searchNearbyPlaces(location) {
    placesElement.innerHTML = '<li>Joylar aniqlanmoqda...</li>';
    placesService = new google.maps.places.PlacesService(map);
    placesService.nearbySearch({ location, radius: 1000, type: ['establishment'] }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            displayNearbyPlaces(results);
        } else {
            placesElement.innerHTML = '<li>Joylarni topib bo‘lmadi.</li>';
        }
    });
}

// Joylarni chiqarish
function displayNearbyPlaces(places) {
    placesElement.innerHTML = '';
    places.slice(0, 5).forEach(place => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${place.name}</strong> - ${place.vicinity || 'Manzil mavjud emas'}`;
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
            new google.maps.Marker({ position: place.geometry.location, map: map, title: place.name, animation: google.maps.Animation.DROP });
        });
        placesElement.appendChild(li);
    });
}

// Xatoliklarni qayta ishlash
function handleLocationError(error) {
    const messages = {
        1: "Foydalanuvchi geolokatsiyani rad etdi.",
        2: "Joylashuv ma'lumotlari mavjud emas.",
        3: "So‘rov vaqti tugadi."
    };
    locationElement.innerHTML = `<span>${messages[error.code] || "Xatolik yuz berdi."}</span>`;
    timeElement.innerHTML = `<span>Mahalliy vaqt aniqlanmayapti.</span>`;
    placesElement.innerHTML = `<li>Joylarni aniqlab bo‘lmadi.</li>`;
    map.setCenter({ lat: 41.3111, lng: 69.2407 });
}

// Yangilash tugmasi bosilganda
refreshButton.addEventListener('click', getUserLocation);

document.addEventListener('DOMContentLoaded', () => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    document.head.appendChild(script);
});
