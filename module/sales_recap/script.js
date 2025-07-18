pagemoduleparent = "sales";
const ctxMarketingBar = document.getElementById("chartMarketingBar");
new Chart(ctxMarketingBar, {
  type: "bar",
  data: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Material",
        data: [0, 100000000, 1500000000, 500000000, 400000000, 50000000, 0],
        backgroundColor: "#1e40af",
        borderRadius: 4,
      },
      {
        label: "Service",
        data: [0, 0, 500000000, 1500000000, 500000000, 300000000, 0],
        backgroundColor: "#3b82f6",
        borderRadius: 4,
      },
      {
        label: "Turn Key",
        data: [0, 0, 1000000000, 5500000000, 500000000, 8000000000, 0],
        backgroundColor: "#93c5fd",
        borderRadius: 4,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 12,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return (
              context.dataset.label +
              ": Rp" +
              context.raw.toLocaleString("id-ID")
            );
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
        },
        ticks: {
          callback: (value) => "Rp" + (value / 1000000000).toFixed(1) + "B",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  },
});

// Pie Chart
const ctxMarketingPie = document.getElementById("chartMarketingPie");
new Chart(ctxMarketingPie, {
  type: "pie",
  data: {
    labels: ["Material", "Service", "Turn Key"],
    datasets: [
      {
        data: [2664263562, 742300000, 16614322478],
        backgroundColor: ["#1e40af", "#3b82f6", "#93c5fd"],
        borderWidth: 0,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const value = context.raw;
            const percentage = Math.round((value / total) * 100);
            return (
              context.label +
              ": Rp" +
              value.toLocaleString("id-ID") +
              ` (${percentage}%)`
            );
          },
        },
      },
    },
    cutout: "65%",
  },
});
