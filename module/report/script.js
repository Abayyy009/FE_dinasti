async function loadModuleContent(module, id) {
  if (module !== "detail_sales") return;

  try {
    const res = await fetch(
      `https://devdinasti.katib.cloud/detail/sales/${id}`,
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await res.json();
    console.log("✅ Response JSON:", result);

    const { data } = result;
    if (!data) {
      console.warn("⚠️ Tidak ada 'data' dalam response");
      return;
    }

    console.log("📦 Data siap diproses:", data);
    populateQuotationPage(data);
  } catch (err) {
    console.error("❌ Error saat load detail sales:", err);
    alert("Gagal memuat detail sales.");
  }
}

function populateQuotationPage(data) {
  console.log("🚀 Menjalankan populateQuotationPage");

  // Cek data utama
  if (!data) {
    console.error("⛔ Data tidak tersedia!");
    return;
  }

  // Cek elemen target
  const requiredIds = [
    "quotationDate",
    "quotationNumber",
    "quotationRev",
    "clientName",
    "projectName",
    "projectType",
    "companyName",
    "status",
    "contractAmount",
    "tableBody",
    "subtotal",
    "disc",
    "shipping",
    "ppn",
    "total",
  ];

  requiredIds.forEach((id) => {
    if (!document.getElementById(id)) {
      console.warn(`⚠️ Element ID #${id} tidak ditemukan di halaman`);
    }
  });

  // Header Quotation
  document.getElementById("quotationDate").textContent = data.tanggal || "-";
  document.getElementById("quotationNumber").textContent = data.no_qtn || "-";
  document.getElementById("quotationRev").textContent =
    data.revision_status || "-";

  // Informasi Klien / Proyek
  document.getElementById("clientName").textContent = data.user_nama || "-";
  document.getElementById("projectName").textContent = data.project_name || "-";
  document.getElementById("projectType").textContent = data.project_type || "-";
  document.getElementById("companyName").textContent =
    data.pelanggan_nama || "-";
  document.getElementById("status").textContent = data.status || "-";
  document.getElementById("contractAmount").textContent = `Rp ${numberFormat(
    data.contract_amount
  )}`;

  // Render Item Tabel
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  if (Array.isArray(data.items)) {
    console.log("🧾 Menampilkan item:", data.items);
    data.items.forEach((item, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="border px-4 py-2 text-center">${index + 1}</td>
        <td class="border px-4 py-2">${item.description}</td>
        <td class="border px-4 py-2 text-center">${item.qty}</td>
        <td class="border px-4 py-2 text-center">${item.unit}</td>
        <td class="border px-4 py-2 text-right">Rp ${numberFormat(
          item.unit_price
        )}</td>
        <td class="border px-4 py-2 text-right">Rp ${numberFormat(
          item.total
        )}</td>
      `;
      tableBody.appendChild(row);
    });
  } else {
    console.warn("❌ data.items bukan array atau kosong:", data.items);
  }

  // Bagian Total
  document.getElementById("subtotal").textContent = `Rp ${numberFormat(
    data.subtotal
  )}`;
  document.getElementById("disc").textContent = `Rp ${numberFormat(data.disc)}`;
  document.getElementById("shipping").textContent = `Rp ${numberFormat(
    data.shipping
  )}`;
  document.getElementById("ppn").textContent = `Rp ${numberFormat(data.ppn)}`;
  document.getElementById("total").textContent = `Rp ${numberFormat(
    data.total
  )}`;

  console.log("✅ Selesai populate data ke halaman");
}
