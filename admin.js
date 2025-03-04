document.addEventListener('DOMContentLoaded', async function () {
    await loadOrders(); // Memuat data pesanan
});

const ADMIN_WHATSAPP = '+6282251892599'; // Ganti dengan nomor WhatsApp admin

let lastOrderCount = 0; // Simpan jumlah pesanan terakhir untuk cek pesanan baru

document.addEventListener('DOMContentLoaded', function () {
    connectWebSocket();
});

function connectWebSocket() {
    const socket = new WebSocket('wss://your-glitch-project.glitch.me'); // Ganti dengan URL Glitch kamu

    socket.onopen = () => {
        console.log("🔗 WebSocket Terhubung");
    };

    socket.onmessage = (event) => {
        console.log("📩 Pesanan baru diterima:", event.data);
        updateOrders(JSON.parse(event.data));
    };

    socket.onerror = (error) => {
        console.error("❌ WebSocket Error:", error);
    };

    socket.onclose = () => {
        console.log("⚠️ WebSocket Ditutup, mencoba reconnect...");
        setTimeout(connectWebSocket, 5000); // Coba reconnect setelah 5 detik
    };
}

async function loadOrders() {
    try {
        const response = await fetch('https://backend2-jade.vercel.app/orders');
        const orders = await response.json();

        // Urutkan data agar pesanan terbaru ada di paling atas
        orders.reverse();

        const ordersTable = document.getElementById('ordersTable').getElementsByTagName('tbody')[0];
        ordersTable.innerHTML = '';

        orders.forEach(order => {
            const row = ordersTable.insertRow();
            row.insertCell().textContent = order.name;
            row.insertCell().textContent = order.whatsapp;
            row.insertCell().textContent = order.location;
            row.insertCell().textContent = order.date;
            row.insertCell().textContent = order.time;
            row.insertCell().textContent = order.package;
            row.insertCell().textContent = `Rp ${order.dpAmount.toLocaleString()}`;
            row.insertCell().textContent = order.status;

            const actionCell = row.insertCell();
            const whatsappButton = document.createElement('button');
            whatsappButton.textContent = 'Kirim WhatsApp';
            whatsappButton.onclick = () => sendWhatsApp(order.whatsapp, order);
            actionCell.appendChild(whatsappButton);
        });

        // Cek apakah ada pesanan baru
        if (orders.length > lastOrderCount) {
            notifyAdmin(orders[0]); // Kirim notifikasi pesanan terbaru
        }

        // Update jumlah pesanan terakhir
        lastOrderCount = orders.length;

    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function searchOrders() {
    const input = document.getElementById("searchInput").value.toLowerCase();
    const table = document.getElementById("ordersTable").getElementsByTagName("tbody")[0];
    const rows = table.getElementsByTagName("tr");

    for (let row of rows) {
        let text = row.textContent.toLowerCase();
        row.style.display = text.includes(input) ? "" : "none";
    }
}


// Fungsi kirim notifikasi ke admin
async function notifyAdmin(order) {
    try {
        await fetch("https://smiling-respected-recess.glitch.me/send-admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(order),
        });
        console.log("✅ Notifikasi terkirim ke admin!");
    } catch (error) {
        console.error("❌ Gagal mengirim notifikasi admin:", error);
    }
}
// Fungsi kirim WhatsApp ke pelanggan
function sendWhatsApp(phoneNumber, order) {
    const message = `Halo ${order.name}, terima kasih telah memesan paket ${order.package} pada tanggal ${order.date} pukul ${order.time}. DP sebesar Rp ${order.dpAmount.toLocaleString()} telah diterima.`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}
