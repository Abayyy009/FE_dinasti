pagemoduleparent = "salesrecap";

async function renderSalesRecap() {
  try {
    const res = await fetch(`${baseUrl}/marketing/recap_sales/2025`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    const result = await res.json();
    if (!result.data) return;

    const { chart, table } = result.data;

    /* ==================== KEY METRICS ==================== */
    const totalAchievement = table.rows.reduce(
      (sum, row) => sum + (row.total || 0),
      0
    );
    const target = 35000000000; // target bisa dinamis kalau ada di API
    const remaining = target - totalAchievement;
    const pipelineValue = table.rows.reduce((sum, row) => sum + row.total, 0);

    document.getElementById(
      "metricAchievement"
    ).innerText = `Rp${totalAchievement.toLocaleString("id-ID")}`;
    document.getElementById("metricAchievementRate").innerText = `${(
      (totalAchievement / target) *
      100
    ).toFixed(1)}% of target`;
    document.getElementById(
      "metricPipeline"
    ).innerText = `Rp${pipelineValue.toLocaleString("id-ID")}`;
    document.getElementById(
      "metricRemaining"
    ).innerText = `Rp${remaining.toLocaleString("id-ID")}`;
    document.getElementById("metricRemainingRate").innerText = `${(
      (remaining / target) *
      100
    ).toFixed(1)}% to achieve`;

    /* ==================== BAR CHART ==================== */
    const colors = [
      "#1e40af",
      "#3b82f6",
      "#93c5fd",
      "#f59e0b",
      "#10b981",
      "#ef4444",
    ];

    const datasets = chart.types.map((type, idx) => ({
      label: type,
      data: table.rows.map((row) => row[type] || 0),
      backgroundColor: colors[idx % colors.length],
      borderRadius: 4,
    }));

    const ctxBar = document.getElementById("chartMarketingBar");
    if (ctxBar) {
      new Chart(ctxBar, {
        type: "bar",
        data: {
          labels: chart.months,
          datasets: datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "top", labels: { boxWidth: 12, padding: 20 } },
            tooltip: {
              callbacks: {
                label: (context) =>
                  `${context.dataset.label}: Rp${context.raw.toLocaleString(
                    "id-ID"
                  )}`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => "Rp" + (value / 1000000).toFixed(1) + "jt",
              },
            },
            x: { grid: { display: false } },
          },
        },
      });
    }

    /* ==================== TABLE ==================== */
    const tableEl = document.getElementById("salesRecapTable");
    if (tableEl) {
      let thead = `<thead class="bg-gray-50"><tr>`;
      table.columns.forEach((col) => {
        thead += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${col.label}</th>`;
      });
      thead += `</tr></thead>`;

      let tbody = `<tbody class="bg-white divide-y divide-gray-200">`;
      table.rows.forEach((row) => {
        tbody += `<tr class="hover:bg-gray-50">`;
        table.columns.forEach((col) => {
          const val = row[col.key];
          const isNumber = typeof val === "number";
          tbody += `<td class="px-6 py-4 whitespace-nowrap text-sm ${
            col.key === "month" ? "font-medium text-gray-900" : "text-gray-700"
          }">
            ${isNumber ? `Rp${val.toLocaleString("id-ID")}` : val}
          </td>`;
        });
        tbody += `</tr>`;
      });

      // TOTAL row otomatis
      tbody += `<tr class="bg-gray-50 font-bold">`;
      table.columns.forEach((col) => {
        if (col.key === "month") {
          tbody += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">TOTAL</td>`;
        } else {
          const totalCol = table.rows.reduce(
            (sum, row) => sum + (row[col.key] || 0),
            0
          );
          tbody += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp${totalCol.toLocaleString(
            "id-ID"
          )}</td>`;
        }
      });
      tbody += `</tr></tbody>`;

      tableEl.innerHTML = thead + tbody;
    }
  } catch (err) {
    console.error("Error render Sales Recap:", err);
  }
}

if (pagemoduleparent === "salesrecap") {
  renderSalesRecap();
}
