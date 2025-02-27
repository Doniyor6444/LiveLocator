// Geolokatsiyani so'rov qilish
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const latitude = position.coords.latitude; // Kenglik
            const longitude = position.coords.longitude; // Uzunlik

            // Joylashuvni aniqlash uchun API dan foydalanish
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
                .then(response => response.json())
                .then(data => {
                    const city = data.city || data.locality; // Shahar nomi
                    const country = data.countryName; // Davlat nomi
                    document.getElementById('location').textContent = `Siz joylashgan shahar: ${city}, ${country}`;
                })
                .catch(error => {
                    console.error('Xatolik yuz berdi:', error);
                    document.getElementById('location').textContent = 'Joylashuvni aniqlashda xatolik yuz berdi.';
                });
        },
        (error) => {
            console.error('Geolokatsiya so\'rovida xatolik:', error);
            document.getElementById('location').textContent = 'Geolokatsiya so\'rovini amalga oshirib bo\'lmadi.';
        }
    );
} else {
    document.getElementById('location').textContent = 'Brauzeringiz geolokatsiyani qo\'llamaydi.';
}