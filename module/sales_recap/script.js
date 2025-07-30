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

    /* ====== CHART ====== */
    /* ==================== CHART: BAR + LINE (TREND) ==================== */
    const colors = [
      "#1e40af",
      "#3b82f6",
      "#93c5fd",
      "#f59e0b",
      "#10b981",
      "#ef4444",
    ];

    // Ambil daftar kolom type (tanpa month & total)
    const typeCols = table.columns.filter(
      (c) => c.key !== "month" && c.key !== "total"
    );
    const labels = table.rows.map((r) => r.month);

    // Dataset bar per type
    const barDatasets = typeCols.map((col, idx) => ({
      type: "bar",
      label: col.label,
      data: table.rows.map((r) => r[col.key] || 0),
      backgroundColor: colors[idx % colors.length],
      borderRadius: 4,
      order: 1, // digambar duluan (di bawah garis)
    }));

    // Data garis “Total” per bulan (pakai nilai total dari API jika ada, fallback hitung manual)
    const monthlyTotals = table.rows.map((r) =>
      typeof r.total === "number"
        ? r.total
        : typeCols.reduce((sum, c) => sum + (r[c.key] || 0), 0)
    );

    // Dataset line untuk Trend (Total)
    const trendDataset = {
      type: "line",
      label: "Total",
      data: monthlyTotals,
      borderColor: "#111827", // gray-900
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 4,
      fill: false,
      tension: 0.25, // sedikit smoothing
      order: 2, // digambar terakhir (di atas bar)
    };

    const ctxBar = document.getElementById("chartMarketingBar");
    if (ctxBar) {
      new Chart(ctxBar, {
        type: "bar",
        data: {
          labels,
          datasets: [...barDatasets, trendDataset],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              position: "bottom",
              labels: { boxWidth: 12, padding: 16 },
            },
            tooltip: {
              callbacks: {
                label: (context) =>
                  `${context.dataset.label}: Rp${Number(
                    context.raw || 0
                  ).toLocaleString("id-ID")}`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) =>
                  "Rp" + (value / 1_000_000).toFixed(1) + "jt",
              },
              grid: { drawBorder: false },
            },
            x: { grid: { display: false } },
          },
        },
      });
    }

    /* ====== TABLE ====== */
    const tableEl = document.getElementById("salesRecapTable");

    // Buat header: Bulan jadi kolom
    let thead = `<thead class="bg-gray-50">
  <tr>
    <th class="border px-3 py-2 text-left">Type</th>`;
    table.rows.forEach((row) => {
      thead += `<th class="border px-3 py-2">${row.month}</th>`;
    });
    thead += `<th class="border px-3 py-2">Total</th></tr></thead>`;

    // Body: type jadi baris
    let tbody = `<tbody>`;
    const types = table.columns
      .filter((c) => c.key !== "month" && c.key !== "total")
      .map((c) => c.key);

    types.forEach((typeKey) => {
      tbody += `<tr class="hover:bg-gray-50">
    <td class="border px-3 py-2 font-medium">${
      table.columns.find((c) => c.key === typeKey).label
    }</td>`;

      // Kolom per bulan
      table.rows.forEach((row) => {
        const val = row[typeKey] || 0;
        tbody += `<td class="border px-3 py-2 text-right">Rp${val.toLocaleString(
          "id-ID"
        )}</td>`;
      });

      // Total per type (baris)
      const totalType = table.rows.reduce(
        (sum, row) => sum + (row[typeKey] || 0),
        0
      );
      tbody += `<td class="border px-3 py-2 font-semibold text-right">Rp${totalType.toLocaleString(
        "id-ID"
      )}</td>`;

      tbody += `</tr>`;
    });

    // Baris TOTAL semua type
    tbody += `<tr class="bg-gray-100 font-bold">
  <td class="border px-3 py-2">TOTAL</td>`;
    table.rows.forEach((row) => {
      const totalMonth = types.reduce(
        (sum, typeKey) => sum + (row[typeKey] || 0),
        0
      );
      tbody += `<td class="border px-3 py-2 text-right">Rp${totalMonth.toLocaleString(
        "id-ID"
      )}</td>`;
    });

    // Total keseluruhan
    const totalAll = types.reduce(
      (sum, typeKey) =>
        sum + table.rows.reduce((sub, row) => sub + (row[typeKey] || 0), 0),
      0
    );
    tbody += `<td class="border px-3 py-2 text-right">Rp${totalAll.toLocaleString(
      "id-ID"
    )}</td></tr>`;
    tbody += `</tbody>`;

    tableEl.innerHTML = thead + tbody;
  } catch (err) {
    console.error("Error render Sales Recap:", err);
  }
}

if (pagemoduleparent === "salesrecap") {
  renderSalesRecap();
}
