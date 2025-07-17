const dummyLabels = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];
const dummyData = [
  1200000, 1800000, 1500000, 2000000, 1750000, 2200000, 1950000,
];

let salesChart = null;
let currentPeriod = "weekly";

function loadSalesGraph(period = "weekly") {
  currentPeriod = period;

  const ctx = document.getElementById("salesChart").getContext("2d");

  // Ganti data sesuai periode (masih dummy)
  let labels = dummyLabels;
  let data = dummyData;

  // Jika chart sudah ada, hapus dulu
  if (salesChart) {
    salesChart.destroy();
  }

  const selectedChartType = document.getElementById("chartTypeSelector").value;

  // Buat grafik baru
  salesChart = new Chart(ctx, {
    type: selectedChartType, // 'bar' atau 'line'
    data: {
      labels: labels,
      datasets: [
        {
          label: "Total Penjualan (Rp)",
          data: data,
          backgroundColor:
            selectedChartType === "bar"
              ? "rgba(59, 130, 246, 0.5)"
              : "rgba(59, 130, 246, 0.2)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 2,
          fill: selectedChartType === "line",
          tension: 0.3,
          pointBackgroundColor: "white",
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          ticks: {
            callback: (value) => "Rp " + value.toLocaleString(),
            beginAtZero: true,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `Rp ${ctx.parsed.y.toLocaleString()}`,
          },
        },
      },
    },
  });
}

// Jalankan saat halaman selesai dimuat
window.addEventListener("DOMContentLoaded", () => {
  loadSalesGraph();
});
