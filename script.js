let selectedPackage = '';
let totalPrice = 0;

// Mapping interval waktu berdasarkan paket
const timeIntervals = {
    'Basic': 15,
    'Edge': 25,
    'Deluxe': 45
};

// Fungsi untuk membuka modal form pemesanan
function openOrderForm(packageName, price) {
    selectedPackage = packageName;
    totalPrice = price;
    //let dp = totalPrice * 0.5; // DP 50%
    let dp = 150000;
    document.getElementById('selectedPackage').innerText = `Paket: ${selectedPackage}`;
    document.getElementById('dpAmount').innerText = `Rp ${dp.toLocaleString()}`;
    document.getElementById('orderModal').style.display = 'flex';
}

// Fungsi untuk menutup modal form
function closeOrderForm() {
    document.getElementById('orderModal').style.display = 'none';
}

document.getElementById('date').addEventListener('change', async function () {
    let selectedDate = this.value;
    let timeContainer = document.getElementById('timeContainer');
    timeContainer.innerHTML = "<p>Memuat waktu tersedia...</p>";

    try {
        let response = await fetch(`https://backend2-jade.vercel.app/available-times?date=${selectedDate}`);
        let result = await response.json();

        if (result.success) {
            timeContainer.innerHTML = "";
            let interval = timeIntervals[selectedPackage] || 15;
            let availableTimes = generateTimeSlots(result.availableTimes, interval);

            availableTimes.forEach(time => {
                let button = document.createElement('button');
                button.setAttribute('type', 'button');
                button.textContent = time;
                button.classList.add('time-button');
                button.onclick = function () {
                    document.querySelectorAll('.time-button').forEach(btn => btn.classList.remove('selected'));
                    button.classList.add('selected');
                    document.getElementById('selectedTime').value = time;
                };
                timeContainer.appendChild(button);
            });
        } else {
            timeContainer.innerHTML = "<p>Tidak ada waktu tersedia.</p>";
        }
    } catch (error) {
        console.error("Kesalahan saat mengambil data:", error);
        timeContainer.innerHTML = "<p>Terjadi kesalahan saat mengambil data.</p>";
    }
});

// Fungsi untuk menghasilkan slot waktu berdasarkan interval
function generateTimeSlots(availableTimes, interval) {
    let slots = [];
    availableTimes.forEach(time => {
        let [hour, minute] = time.split(':').map(Number);
        let currentTime = new Date();

        // Atur waktu awal (jika kurang dari 04:00, ubah jadi 04:00)
        if (hour > 4) {
            currentTime.setHours(4, 0, 0);
        } else {
            currentTime.setHours(hour, minute, 0);
        }

        // Hanya menghasilkan slot dalam rentang 04:00 - 21:00
        while (currentTime.getHours() >= 4 && currentTime.getHours() < 21) {
            let formattedTime = currentTime.toTimeString().slice(0, 5);
            slots.push(formattedTime);
            currentTime.setMinutes(currentTime.getMinutes() + interval);
        }
    });
    return slots;
}
// Event listener untuk submit form
document.getElementById('bookingForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    let orderData = {
        name: document.getElementById('name').value,
        whatsapp: document.getElementById('whatsapp').value,
        location: document.getElementById('location').value,
        date: document.getElementById('date').value,
        time: document.getElementById('selectedTime').value,
        package: selectedPackage,
        dpAmount: 150000
    };

    try {
        let response = await fetch('http://localhost:5001/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        let result = await response.json();

        if (result.success) {
            proceedToPayment(result.order_id, orderData.dpAmount);
        } else {
            alert(result.message || 'Gagal membuat pesanan.');
        }
    } catch (error) {
        console.error(error);
        alert('Terjadi kesalahan saat memproses pesanan.');
    }
});

// Fungsi untuk memproses pembayaran dengan Midtrans
async function proceedToPayment(orderId, dpAmount) {
    try {
        let response = await fetch('http://localhost:5001/create-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, amount: dpAmount })
        });

        let result = await response.json();

        if (result.transaction_token) {
            snap.pay(result.transaction_token, {
                onSuccess: function (result) {
                    alert('Pembayaran berhasil! Pesanan Anda telah dikonfirmasi.');
                    console.log(result);
                    closeOrderForm();
                },
                onPending: function (result) {
                    alert('Menunggu pembayaran...');
                    console.log(result);
                },
                onError: function (result) {
                    alert('Pembayaran gagal.');
                    console.log(result);
                },
                onClose: function () {
                    alert('Anda menutup popup pembayaran tanpa menyelesaikan transaksi.');
                }
            });
        } else {
            alert('Gagal mendapatkan token pembayaran.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat memproses pembayaran.');
    }
}
