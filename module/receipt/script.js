pagemodule = "sales detail";
colSpanCount = 9;
setDataType("sales_detail");
async function loadModule(module, id) {
  if (module === "sales_detail") {
    try {
      const res = await fetch(
        `https://devdinasti.katib.cloud/detail/sales/${id}`,
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
          },
        }
      );
      const data = await res.json();
      renderSalesDetail(data); // fungsi untuk render ke konten halaman
    } catch (error) {
      console.error("Gagal memuat detail sales:", error);
    }
  }
}

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(number);
}

function renderQuotation(data) {
  // Header Info
  document.getElementById("quotationDate").textContent =
    data.quotation_date || "-";
  document.getElementById("quotationNumber").textContent =
    data.quotation_number || "-";
  document.getElementById("quotationRev").textContent =
    data.quotation_rev || "-";

  // Client Info
  document.getElementById("clientName").textContent = data.client_name || "-";
  document.getElementById("projectName").textContent = `Project: ${
    data.project_name || "-"
  }`;
  document.getElementById("companyName").textContent = data.company_name || "-";

  // Table Items
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";
  let subtotal = 0;

  data.items.forEach((item, index) => {
    const total = item.qty * item.unit_price;
    subtotal += total;

    const row = `
      <tr>
        <td class="px-4 py-2 border text-center">${index + 1}</td>
        <td class="px-4 py-2 border">${item.description}</td>
        <td class="px-4 py-2 border text-center">${item.qty}</td>
        <td class="px-4 py-2 border text-center">${item.unit}</td>
        <td class="px-4 py-2 border text-right">${formatRupiah(
          item.unit_price
        )}</td>
        <td class="px-4 py-2 border text-right">${formatRupiah(total)}</td>
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", row);
  });

  // Total Section
  const disc = data.disc || 0;
  const shipping = data.shipping || 0;
  const ppnAmount = subtotal * (data.ppn || 0);
  const total = subtotal - disc + shipping + ppnAmount;

  document.getElementById("subtotal").textContent = formatRupiah(subtotal);
  document.getElementById("disc").textContent = formatRupiah(disc);
  document.getElementById("shipping").textContent = formatRupiah(shipping);
  document.getElementById("ppn").textContent = formatRupiah(ppnAmount);
  document.getElementById("total").textContent = formatRupiah(total);
}

// Simulasi panggilan dari API atau data lokal
document.addEventListener("DOMContentLoaded", function () {
  // Bisa diganti dengan fetch('URL_API') lalu .then(res => res.json())
  renderQuotation(quotationData);
});
