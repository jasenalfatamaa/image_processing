// Ganti URL ini sesuai tempat backend berjalan
// Jika di PC manual: http://localhost:8000
// Jika di Docker Laptop: http://localhost:8000
const API_URL = "http://localhost:8000";

async function uploadImage() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    if (!file) return alert("Pilih gambar dulu!");

    const formData = new FormData();
    formData.append("file", file);

    // Tampilkan kotak status
    document.getElementById('statusBox').style.display = 'block';
    document.getElementById('statusText').innerText = "Uploading...";
    document.getElementById('resultImage').style.display = 'none';

    try {
        // 1. Upload ke API
        const response = await fetch(`${API_URL}/upload/`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        document.getElementById('taskId').innerText = data.task_id;
        document.getElementById('statusText').innerText = "Processing in Queue...";

        // 2. Mulai Polling (Cek status berulang kali)
        pollStatus(data.task_id);

    } catch (error) {
        console.error(error);
        alert("Upload gagal!");
    }
}

async function pollStatus(taskId) {
    const interval = setInterval(async () => {
        try {
            const res = await fetch(`${API_URL}/status/${taskId}`);
            const data = await res.json();

            document.getElementById('statusText').innerText = data.status;

            if (data.status === "SUCCESS") {
                clearInterval(interval); // Stop checking
                
                // Ambil path file dari hasil backend
                // Backend mengembalikan path file lokal, kita perlu ubah jadi URL
                // Asumsi backend return: "processed_images/processed_namafile.jpg"
                // Kita perlu ambil nama filenya saja
                const filepath = data.result.file; 
                const filename = filepath.split("/").pop().split("\\").pop(); // Hack ambil filename
                
                const imageUrl = `${API_URL}/results/${filename}`;
                
                const img = document.getElementById('resultImage');
                img.src = imageUrl;
                img.style.display = 'block';
            } else if (data.status === "FAILURE") {
                clearInterval(interval);
                alert("Proses Gagal!");
            }
        } catch (e) {
            clearInterval(interval);
            console.error(e);
        }
    }, 2000); // Cek setiap 2 detik
}