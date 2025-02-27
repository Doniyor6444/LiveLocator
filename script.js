   
        // API kaliti (faqat bir joyda aniqlanadi)
        const apiKey = 'https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY'; // Eslatma: O'zingizning kalitingizni kiriting
        let map, userMarker, placesService;
        
        // DOM elementlarini olish
        const locationElement = document.getElementById('location');
        const timeElement = document.getElementById('local-time');
        const placesElement = document.getElementById('nearby-places');
        const mapElement = document.getElementById('map');
        const refreshButton = document.getElementById('refresh-button');
        
        // Xaritani yaratish
        function initMap() {
            // Google Maps API muvaffaqiyatli yuklangandan keyin ishlaydi
            window.initMapCallback = function() {
                // Xaritani boshlang'ich manzil bilan yaratish
                map = new google.maps.Map(mapElement, {
                    center: { lat: 41.3111, lng: 69.2407 }, // Toshkent, O'zbekiston (standart)
                    zoom: 13,
                    mapTypeControl: true,
                    fullscreenControl: true,
                    streetViewControl: true,
                    zoomControl: true
                });
                
                // Foydalanuvchi joylashuvini aniqlash
                getUserLocation();
            };
            
            // API ni yuklash
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMapCallback`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }
        
        // Foydalanuvchi joylashuvini aniqlash
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
        
        // Joylashuv muvaffaqiyatli aniqlanganda
        function handleLocationSuccess(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            // Xarita markazini yangilash
            const userLocation = { lat: latitude, lng: longitude };
            map.setCenter(userLocation);
            
            // Foydalanuvchi markeri
            if (userMarker) userMarker.setMap(null); // Eski markerni o'chirish
            
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
            
            // Ma'lumotlarni yangilash
            updateLocationInfo(latitude, longitude);
            searchNearbyPlaces(userLocation);
        }
        
        // Joylashuv ma'lumotlarini yangilash
        function updateLocationInfo(latitude, longitude) {
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=uz`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Geolokatsiya ma\'lumotlarini olishda xatolik');
                    }
                    return response.json();
                })
                .then(data => {
                    // Shahar va mamlakat
                    const city = data.city || data.locality || "Noma'lum shahar";
                    const country = data.countryName || "Noma'lum mamlakat";
                    locationElement.innerHTML = `<strong>${city}, ${country}</strong> <small>(${latitude.toFixed(6)}, ${longitude.toFixed(6)})</small>`;
                    
                    // Mahalliy vaqt
                    updateLocalTime(data.timezone);
                })
                .catch(error => {
                    console.error('Joylashuv ma\'lumotlarini olishda xatolik:', error);
                    locationElement.innerHTML = `<span class="error-message">Joylashuv ma'lumotlarini olishda xatolik. Koordinatalar: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</span>`;
                    updateLocalTime();
                });
        }
        
        // Mahalliy vaqtni yangilash
        function updateLocalTime(timezone) {
            const options = {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            
            const localTime = new Date().toLocaleString('uz-UZ', options);
            timeElement.innerHTML = `<strong>${localTime}</strong>`;
            
            // Vaqtni har soniyada yangilash
            setTimeout(() => updateLocalTime(timezone), 1000);
        }
        
        // Yaqin atrofdagi joylarni qidirish
        function searchNearbyPlaces(location) {
            placesElement.innerHTML = '<li><span class="loading"><span class="spinner"></span>Joylar aniqlanmoqda...</span></li>';
            
            if (!placesService) {
                placesService = new google.maps.places.PlacesService(map);
            }
            
            const request = {
                location: location,
                radius: 1000,
                type: ['establishment']
            };
            
            placesService.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                    displayNearbyPlaces(results);
                } else {
                    placesElement.innerHTML = '<li class="error-message">Yaqin atrofdagi joylarni topishda xatolik yuz berdi.</li>';
                }
            });
        }
        
        // Yaqin atrofdagi joylarni ko'rsatish
        function displayNearbyPlaces(places) {
            placesElement.innerHTML = '';
            
            // Faqat 5 ta joyni ko'rsatish
            const placesToShow = places.slice(0, 5);
            
            placesToShow.forEach(place => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${place.name}</strong> - ${place.vicinity || 'Manzil mavjud emas'}`;
                
                // Joyga bosganda xaritada ko'rsatish
                li.style.cursor = 'pointer';
                li.addEventListener('click', () => {
                    map.setCenter(place.geometry.location);
                    map.setZoom(17);
                    
                    // Joyni belgilash
                    new google.maps.Marker({
                        position: place.geometry.location,
                        map: map,
                        title: place.name,
                        animation: google.maps.Animation.DROP
                    });
                });
                
                placesElement.appendChild(li);
            });
        }
        
        // Xatoliklarni qayta ishlash
        function handleLocationError(error) {
            console.error('Geolokatsiya xatosi:', error);
            
            let errorMessage;
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "Foydalanuvchi geolokatsiya so'rovini rad etdi.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "Joylashuv ma'lumotlari mavjud emas.";
                    break;
                case error.TIMEOUT:
                    errorMessage = "Joylashuvni aniqlash so'rovi vaqti tugadi.";
                    break;
                default:
                    errorMessage = "Geolokatsiyani aniqlashda noma'lum xatolik yuz berdi.";
            }
            
            locationElement.innerHTML = `<span class="error-message">${errorMessage}</span>`;
            timeElement.innerHTML = `<span class="error-message">Mahalliy vaqtni aniqlashda xatolik.</span>`;
            placesElement.innerHTML = `<li class="error-message">Yaqin atrofdagi joylarni aniqlashda xatolik.</li>`;
            
            // Xaritada standart joy ko'rsatish
            map.setCenter({ lat: 41.3111, lng: 69.2407 }); // Toshkent, O'zbekiston (standart)
        }
        
        // Yangilash tugmasi
        refreshButton.addEventListener('click', () => {
            locationElement.innerHTML = '<span class="loading"><span class="spinner"></span>Joylashuvingiz aniqlanmoqda...</span>';
            timeElement.innerHTML = '<span class="loading"><span class="spinner"></span>Mahalliy vaqt aniqlanmoqda...</span>';
            placesElement.innerHTML = '<li><span class="loading"><span class="spinner"></span>Joylar aniqlanmoqda...</span></li>';
            
            getUserLocation();
        });
        
        // Sahifa yuklanganda xaritani ishga tushirish
        document.addEventListener('DOMContentLoaded', initMap);
