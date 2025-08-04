pagemoduleparent = "sales";

setTodayDate();
loadCustomerList();
// Harus di atas, sebelum loadSalesType dipanggil
typeLoaded = false;
statusLoaded = false;
oldStatusText = "On Going"; // misalnya status sebelum diedit
lastRevision = 0;

loadProdukList();
formatNumberInputs();
document.getElementById("tanggal").addEventListener("change", tryGenerateNoQtn);
document.getElementById("type_id").addEventListener("change", tryGenerateNoQtn);

if (window.detail_id && window.detail_desc) {
  loadDetailSales(detail_id, detail_desc);
  loadPaymentDetail(detail_id, 0);
  formatNumberInputs();
}

async function loadCustomerList() {
  const res = await fetch(`${baseUrl}/list/client/${owner_id}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const json = await res.json();
  customerList = json.listData || [];
}

async function loadProdukList() {
  const res = await fetch(`${baseUrl}/list/product/${owner_id}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const json = await res.json();
  produkList = json.listData || [];
}

function filterKlienSuggestions() {
  const input = document.getElementById("klien").value.toLowerCase();
  const suggestionBox = document.getElementById("klienSuggestions");
  suggestionBox.innerHTML = "";
  if (input.length < 2) return suggestionBox.classList.add("hidden");
  const filtered = customerList.filter((c) =>
    c.nama.toLowerCase().includes(input)
  );
  if (filtered.length === 0) return suggestionBox.classList.add("hidden");
  filtered.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.nama} (${item.whatsapp})`;
    li.className = "px-3 py-2 hover:bg-gray-200 cursor-pointer";
    li.onclick = () => {
      document.getElementById("klien").value = item.nama;
      document.getElementById("klien_id").value = item.pelanggan_id;
      document.getElementById("no_hp").value = item.whatsapp;
      document.getElementById("alamat").value = item.alamat;
      document.getElementById("city").value = item.region_name;
      document.getElementById("city_id").value = item.region_id;
      suggestionBox.classList.add("hidden");
    };
    suggestionBox.appendChild(li);
  });
  suggestionBox.classList.remove("hidden");
}

function tambahItem() {
  const tbody = document.getElementById("tabelItem");
  const nomor = tbody.children.length + 1;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="border px-3 py-2 text-center">${nomor}</td>
    <td class="border px-3 py-2">
      <input type="text" class="w-full border rounded px-2 itemProduct" placeholder="product">
    </td>
    <td class="border px-3 py-2">
      <input type="text" class="w-full border rounded px-2 itemDesc" placeholder="Deskripsi">
    </td>
    <td class="border px-3 py-2">
      <input type="text" class="w-full border rounded px-2 itemUnit" placeholder="pcs/lusin">
    </td>
    <td class="border px-3 py-2">
      <input type="number" class="w-full border rounded px-2 itemQty text-right" value="1" oninput="recalculateTotal()">
    </td>
    <td class="border px-3 py-2">
      <input type="text" class="w-full border rounded px-2 itemHarga text-right" value="0" oninput="recalculateTotal()">
    </td>
    <td class="border px-3 py-2 text-right itemTotal">0</td>
    <td class="border px-3 py-2 text-center">
      <button onclick="hapusItem(this)" class="text-red-500 hover:underline">Hapus</button>
    </td>
  `;

  tbody.appendChild(tr);
}

function hapusItem(button) {
  const row = button.closest("tr");
  row.remove();

  // Update ulang nomor urut
  const rows = document.querySelectorAll("#tabelItem tr");
  rows.forEach((row, index) => {
    row.children[0].innerText = index + 1;
  });

  // Hitung ulang total
  recalculateTotal();
}

function filterProdukDropdownCustom(inputEl) {
  const value = inputEl.value.toLowerCase();
  const dropdown = inputEl.nextElementSibling;
  const select = inputEl.parentElement.querySelector(".itemNama");
  dropdown.innerHTML = "";

  const filtered = produkList.filter((p) =>
    p.product.toLowerCase().includes(value)
  );
  if (filtered.length === 0) return dropdown.classList.add("hidden");

  filtered.forEach((p) => {
    const div = document.createElement("div");
    div.className = "px-3 py-2 hover:bg-gray-200 cursor-pointer text-sm";
    div.textContent = p.product;
    div.onclick = () => {
      inputEl.value = p.product;
      inputEl.closest("tr").querySelector(".itemHarga").value =
        p.sale_price.toLocaleString("id-ID");
      const opt = Array.from(select.options).find(
        (o) => o.value == p.product_id
      );
      if (opt) select.value = opt.value;
      dropdown.classList.add("hidden");
      recalculateTotal();
    };
    dropdown.appendChild(div);
  });

  dropdown.classList.remove("hidden");
}

function recalculateTotal() {
  let subtotal = 0;
  const rows = document.querySelectorAll("#tabelItem tr");

  rows.forEach((row) => {
    const qty = parseInt(row.querySelector(".itemQty")?.value || 0);
    const harga = parseInt(
      row.querySelector(".itemHarga")?.value.replace(/[^\d]/g, "") || 0
    );
    const total = qty * harga;
    subtotal += total;

    row.querySelector(".itemTotal").innerText = total.toLocaleString("id-ID");
  });

  const diskon = parseInt(
    document.getElementById("inputDiskon")?.value.replace(/[^\d]/g, "") || 0
  );
  const shipping = parseInt(
    document.getElementById("inputShipping")?.value.replace(/[^\d]/g, "") || 0
  );
  const pajak = Math.round(0.11 * subtotal);
  const totalFinal = subtotal - diskon + shipping + pajak;

  document.getElementById("subtotal").innerText =
    subtotal.toLocaleString("id-ID");
  document.getElementById("ppn").innerText = pajak.toLocaleString("id-ID");
  document.getElementById("total").innerText =
    totalFinal.toLocaleString("id-ID");
}

function setTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  document.getElementById("tanggal").value = `${yyyy}-${mm}-${dd}`;
}

function formatNumberInputs() {
  document
    .querySelectorAll(".itemHarga, #inputDiskon, #inputShipping")
    .forEach((input) => {
      input.addEventListener("input", () => {
        const raw = input.value.replace(/[^\d]/g, "");
        if (!raw) {
          input.value = "";
          return;
        }
        input.value = parseInt(raw, 10).toLocaleString("id-ID");
        recalculateTotal();
      });
    });
}

async function submitInvoice() {
  try {
    hitungTotalInvoice();
    const rows = document.querySelectorAll("#tabelItem tr");

    const items = Array.from(rows).map((row, i) => {
      const product = row.querySelector(".itemProduct")?.value.trim() || "";
      const description = row.querySelector(".itemDesc")?.value.trim() || "-";
      const unit = row.querySelector(".itemUnit")?.value.trim() || "pcs";

      const qty = parseInt(row.querySelector(".itemQty")?.value || 0);
      const unit_price = parseInt(
        row.querySelector(".itemHarga")?.value.replace(/[^\d]/g, "") || 0
      );

      if (
        !product ||
        qty <= 0 ||
        !unit ||
        isNaN(unit_price) ||
        unit_price <= 0
      ) {
        throw new Error(
          `❌ Invalid item data in row ${
            i + 1
          }: product, qty, unit, and unit_price are required and must be valid.`
        );
      }

      return {
        product,
        description,
        qty,
        unit,
        unit_price,
        total: qty * unit_price,
      };
    });

    const owner_id = 100;
    const user_id = 100;
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const tanggal = document.getElementById("tanggal")?.value || "";
    const type_id = parseInt(document.getElementById("type_id")?.value || 0);
    const client = document.getElementById("client")?.value || "-";
    const project_name = document.getElementById("project_name")?.value || "-";
    const no_qtn = document.getElementById("no_qtn")?.value || "-";
    const disc = parseInt(
      document.getElementById("discount")?.value.replace(/[^\d]/g, "") || 0
    );
    const shipping = parseInt(
      document.getElementById("shipping")?.value.replace(/[^\d]/g, "") || 0
    );
    const ppn = Math.round(0.11 * subtotal);
    const total = subtotal - disc + shipping + ppn;
    const file = document.getElementById("file")?.files?.[0] || null;

    const formData = new FormData();
    formData.append("owner_id", owner_id);
    formData.append("user_id", user_id);
    formData.append("project_name", project_name);
    formData.append("no_qtn", no_qtn);
    formData.append("client", client);
    if (!type_id || isNaN(type_id) || type_id === 0) {
      throw new Error("❌ Type penjualan belum dipilih.");
    }
    formData.append("type_id", type_id);
    formData.append("tanggal_ymd", tanggal);
    formData.append("contract_amount", subtotal);
    formData.append("disc", disc);
    formData.append("shipping", shipping);
    formData.append("ppn", ppn);
    formData.append("total", total);
    formData.append("items", JSON.stringify(items)); // tetap dikirim sebagai string
    if (file) formData.append("file", file);

    // ✅ Debug isi FormData
    for (const pair of formData.entries()) {
      console.log(pair[0] + ":", pair[1]);
    }

    const res = await fetch(`${baseUrl}/add/sales`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        // ❌ Jangan set Content-Type, FormData akan set otomatis
      },
      body: formData,
    });

    const json = await res.json();

    if (res.ok) {
      Swal.fire("Sukses", "✅ Data penjualan berhasil disimpan.", "success");
      loadModuleContent("sales");
    } else {
      Swal.fire(
        "Gagal",
        json.message || "❌ Gagal menyimpan data penjualan.",
        "error"
      );
    }
  } catch (err) {
    console.error("❌ Submit error:", err);
    Swal.fire("Error", "❌ Terjadi kesalahan saat memproses.", "error");
  }
}

async function updateInvoice() {
  try {
    hitungTotalInvoice();
    const konfirmasi = await Swal.fire({
      title: "Update Data?",
      text: "Apakah kamu yakin ingin menyimpan perubahan invoice ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "✅ Ya, simpan",
      cancelButtonText: "❌ Batal",
    });

    if (!konfirmasi.isConfirmed) return;

    const rows = document.querySelectorAll("#tabelItem tr");
    const items = Array.from(rows).map((row, i) => {
      const namaProduk = row.querySelector(".itemProduct")?.value.trim() || "";
      const deskripsi = row.querySelector(".itemDesc")?.value.trim() || "";
      const unit = row.querySelector(".itemUnit")?.value.trim() || "PCS";
      const qty = parseInt(row.querySelector(".itemQty")?.value || 0);
      const harga = parseInt(
        row.querySelector(".itemHarga")?.value.replace(/[^\d]/g, "") || 0
      );

      // Validasi
      if (!namaProduk || !unit || qty <= 0 || isNaN(harga)) {
        throw new Error(`Invalid item data in row ${i + 1}`);
      }

      return {
        product: namaProduk,
        description: deskripsi,
        unit: unit,
        qty: qty,
        unit_price: harga,
      };
    });

    const discount = parseInt(
      document.getElementById("discount")?.value.replace(/[^\d]/g, "") || 0
    );
    const shipping = parseInt(
      document.getElementById("shipping")?.value.replace(/[^\d]/g, "") || 0
    );
    const ppn = parseInt(
      document.getElementById("ppn")?.value.replace(/[^\d]/g, "") || 0
    );

    const body = {
      owner_id: 100,
      user_id: 100,
      no_qtn: document.getElementById("no_qtn")?.value || "",
      project_name: document.getElementById("project_name")?.value || "",
      client: document.getElementById("client")?.value || "",
      type_id: document.getElementById("type_id")?.value || 0,
      order_date: document.getElementById("tanggal")?.value || "",
      contract_amount: parseInt(
        document
          .getElementById("contract_amount")
          ?.value.replace(/[^\d]/g, "") || 0
      ),
      discount: discount,
      shipping: shipping,
      ppn: ppn,
      status_id: 1, // bisa kamu sesuaikan kalau perlu
      status: "draft", // atau sesuai status sebenarnya
      revision_number: document.getElementById("revision_number")?.value || "",
      items: items,
      file: "",
    };

    console.log("🚀 Update Body:", body);

    const res = await fetch(`${baseUrl}/update/sales/${window.detail_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (res.ok) {
      Swal.fire("Sukses", "✅ Data penjualan berhasil diperbarui.", "success");
      loadModuleContent("sales");
    } else {
      Swal.fire(
        "Gagal",
        json.message || "❌ Gagal update data penjualan.",
        "error"
      );
    }
  } catch (error) {
    console.error("❌ Update error:", error);
    Swal.fire("Error", "❌ Terjadi kesalahan saat memproses.", "error");
  }
}

function loadDetailSales(Id, Detail) {
  window.detail_id = Id;
  window.detail_desc = Detail;

  fetch(`${baseUrl}/detail/sales/${Id}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  })
    .then((res) => res.json())
    .then(async ({ data }) => {
      // Pastikan opsi sudah dimuat terlebih dahulu
      await loadSalesType(); // asumsikan fungsi ini return Promise
      await loadStatusOptions();
      await updateRevisionNumber();
      document.getElementById("formTitle").innerText = `Edit ${Detail}`;
      document.getElementById("tanggal").value = data.tanggal_ymd;
      document.getElementById("type_id").value = data.type_id;
      document.getElementById("no_qtn").value = data.no_qtn;
      document.getElementById("project_name").value = data.project_name;
      document.getElementById("client").value = data.pelanggan_nama;
      document.getElementById("contract_amount").value = data.contract_amount;
      document.getElementById("discount").value = data.disc;
      document.getElementById("shipping").value = data.shipping;
      document.getElementById("ppn").value = data.ppn;

      // Hitung total jika tidak tersedia di data
      const subtotal =
        (data.contract_amount || 0) -
        (data.disc || 0) +
        (data.shipping || 0) +
        (data.ppn || 0);
      document.getElementById("total").value = subtotal;

      document.getElementById("status").value = data.status || "-";
      document.getElementById("revision_number").value =
        data.revision_number || "";

      // Toggle tombol berdasarkan status
      const simpanBtn = document.querySelector(
        'button[onclick="submitInvoice()"]'
      );
      const updateBtn = document.querySelector(
        'button[onclick="updateInvoice()"]'
      );
      const allowedStatus = [1, 2, 6];
      console.log("Status ID:", data.status_id);

      if (allowedStatus.includes(data.status_id)) {
        simpanBtn?.classList.add("hidden"); // karena ini mode edit
        updateBtn?.classList.remove("hidden");
      } else {
        simpanBtn?.classList.add("hidden");
        updateBtn?.classList.add("hidden");
      }

      // Load item
      const tbody = document.getElementById("tabelItem");
      tbody.innerHTML = ""; // Bersihkan isi tabel sebelum load ulang

      data.items.forEach((item, index) => {
        tambahItem(); // Fungsi ini menambahkan <tr> sesuai struktur HTML yang kamu pakai

        const row = tbody.lastElementChild;

        // Set nomor urut otomatis (kolom pertama)
        row.children[0].innerText = index + 1;

        // Set nilai dari API ke masing-masing kolom input
        row.querySelector(".itemProduct").value = item.product || "";
        row.querySelector(".itemDesc").value = item.description || "";
        row.querySelector(".itemUnit").value = item.unit || "";
        row.querySelector(".itemQty").value = item.qty || 1;
        row.querySelector(".itemHarga").value = (
          item.unit_price || 0
        ).toLocaleString("id-ID");
        row.querySelector(".itemTotal").innerText = (
          item.total || item.qty * item.unit_price
        ).toLocaleString("id-ID");
      });

      recalculateTotal();
    })
    .catch((err) => console.error("Gagal load detail:", err));
}

function formatDateForInput(dateStr) {
  const [d, m, y] = dateStr.split("/");
  return `${y}-${m}-${d}`;
}

async function loadPaymentDetail(detail_id) {
  try {
    const res = await fetch(
      `${baseUrl}/list/sales_receipt/${owner_id}/${detail_id}`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }
    );
    const { totalInvoice, totalReceipt, totalRemainingPayment, listData } =
      await res.json();

    // Inject Ringkasan Pembayaran
    document.getElementById(
      "paymentTotalInvoice"
    ).innerText = `Rp ${totalInvoice.toLocaleString("id-ID")}`;
    document.getElementById(
      "paymentTotalPaid"
    ).innerText = `Rp ${totalReceipt.toLocaleString("id-ID")}`;
    document.getElementById(
      "paymentRemaining"
    ).innerText = `Rp ${totalRemainingPayment.toLocaleString("id-ID")}`;

    // Inject List Pembayaran
    const wrapper = document.getElementById("listPembayaran");
    wrapper.innerHTML = "";

    if (!listData || listData.length === 0) {
      wrapper.innerHTML =
        '<p class="text-sm text-gray-500">Belum ada pembayaran.</p>';
      return;
    }

    listData.forEach((item) => {
      const div = document.createElement("div");
      div.className = "border p-3 rounded text-sm bg-white";
      div.innerHTML = `
        <div class="flex justify-between">
          <div class="font-semibold">${item.account}</div>
          <div class="text-gray-500 text-sm">${item.date}</div>
        </div>
        <div class="flex justify-between mt-1">
          <div class="text-gray-600">${item.notes || "-"}</div>
          <div class="font-bold text-green-700">Rp ${item.nominal.toLocaleString(
            "id-ID"
          )}</div>
        </div>
      `;
      wrapper.appendChild(div);
    });
  } catch (err) {
    console.error("❌ Gagal memuat detail pembayaran:", err);
  }
}

async function printInvoice(pesanan_id) {
  try {
    const response = await fetch(`${baseUrl}/detail/sales/${pesanan_id}/pdf`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    const result = await response.json();
    const data = result?.data;
    if (!data) throw new Error("Data faktur tidak ditemukan");

    const { isConfirmed, dismiss } = await Swal.fire({
      title: "Cetak Faktur Penjualan",
      text: "Pilih metode pencetakan:",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Download PDF",
      cancelButtonText: "Print Langsung",
      reverseButtons: true,
    });

    if (isConfirmed) {
      const url = `faktur_print.html?id=${pesanan_id}`;
      Swal.fire({
        title: "Menyiapkan PDF...",
        html: "File akan diunduh otomatis.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();

          const iframe = document.createElement("iframe");
          iframe.src = url + "&mode=download";
          iframe.style.width = "0";
          iframe.style.height = "0";
          iframe.style.border = "none";
          document.body.appendChild(iframe);

          setTimeout(() => {
            Swal.close();
            Swal.fire(
              "Berhasil",
              "Faktur Penjualan berhasil diunduh.",
              "success"
            );
          }, 3000);
        },
      });
    } else if (dismiss === Swal.DismissReason.cancel) {
      window.open(`faktur_print.html?id=${pesanan_id}`, "_blank");
    }
  } catch (error) {
    Swal.fire({
      title: "Gagal",
      text: error.message,
      icon: "error",
    });
  }
}

async function sendWhatsAppInvoice() {
  if (!window.detail_id) return alert("Invoice belum tersedia.");

  try {
    const res = await fetch(`${baseUrl}/detail/sales/${window.detail_id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    const { detail } = await res.json();
    const {
      customer,
      no_inv,
      date,
      sales_detail,
      discount_nominal,
      shipping,
      terms,
      term_payment,
      notes,
    } = detail;

    // Cari nomor WA dari customerList
    const klien = customerList.find(
      (c) => c.pelanggan_id == detail.customer_id
    );
    const wa = klien?.whatsapp?.replace(/\D/g, "");
    if (!wa) return alert("❌ Nomor WhatsApp klien tidak ditemukan.");

    // Format daftar produk
    let produkList = "";
    let subtotal = 0;
    sales_detail.forEach((item, i) => {
      const qty = item.qty;
      const harga = item.unit_price;
      const total = qty * harga;
      subtotal += total;
      produkList += `${i + 1}. ${
        item.product
      } x${qty} @Rp${harga.toLocaleString("id-ID")} = Rp${total.toLocaleString(
        "id-ID"
      )}\n`;
    });

    const pajak = Math.round(subtotal * 0);
    const total = subtotal - discount_nominal + pajak + shipping;

    // Susun pesan WA
    let pesan = `Hallo ${customer},\n\nBerikut tagihan untuk invoice *${no_inv}* (tgl: ${date}):\n\n`;
    pesan += produkList + "\n";
    pesan += `Subtotal: Rp${subtotal.toLocaleString("id-ID")}\n`;
    if (discount_nominal)
      pesan += `Diskon: Rp${discount_nominal.toLocaleString("id-ID")}\n`;
    pesan += `Pajak (0%): Rp${pajak.toLocaleString("id-ID")}\n`;
    if (shipping) pesan += `Ongkir: Rp${shipping.toLocaleString("id-ID")}\n`;
    pesan += `*Total Tagihan: Rp${total.toLocaleString("id-ID")}*\n\n`;
    if (notes) pesan += `📝 *Catatan:*\n${notes}\n\n`;
    if (terms) pesan += `📌 *Syarat & Ketentuan:*\n${terms}\n\n`;
    if (term_payment) pesan += `💰 *Term of Payment:*\n${term_payment}\n\n`;
    pesan += `Silakan lakukan pembayaran sesuai ketentuan. Terima kasih 🙏`;

    // Kirim via WA
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(pesan)}`;
    window.open(url, "_blank");
  } catch (err) {
    console.error("❌ Gagal kirim WA:", err);
    alert("Gagal mengirim pesan WhatsApp.");
  }
}

async function tryGenerateNoQtn() {
  const order_date = document.getElementById("tanggal").value;
  const type_id = document.getElementById("type_id").value;

  if (!order_date || !type_id) return;

  try {
    const response = await fetch(`${baseUrl}/generate/noqtn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        order_date,
        type_id,
        owner_id: 100,
        user_id: 100,
      }),
    });

    const result = await response.json();
    console.log("Hasil generate:", result);

    document.getElementById("no_qtn").value =
      result.data.no_qtn || "[no_qtn kosong]";
  } catch (error) {
    console.error("Gagal generate no_qtn:", error);
  }
}

async function loadSalesType() {
  if (typeLoaded) return;
  typeLoaded = true;

  try {
    const response = await fetch(`${baseUrl}/type/sales`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    if (!response.ok) throw new Error("Gagal mengambil data sales type");

    const result = await response.json();
    const salesTypes = result.data;

    const typeSelect = document.getElementById("type_id");
    typeSelect.innerHTML = '<option value="">Pilih Tipe</option>';

    salesTypes.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.type_id;
      option.textContent = `${item.nama_type} (${item.kode_type})`;
      typeSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Gagal load sales type:", error);
  }
}
async function loadStatusOptions() {
  if (statusLoaded) return;

  try {
    const response = await fetch(`${baseUrl}/status/sales`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    const data = await response.json();

    if (data.response === "200") {
      const select = document.getElementById("status");
      data.data.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.status_id;
        option.textContent = item.status_sales;
        select.appendChild(option);
      });
      statusLoaded = true;
    } else {
      console.error("Gagal memuat status:", data.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

function updateRevisionNumber() {
  const statusSelect = document.getElementById("status");
  const statusText = statusSelect.options[statusSelect.selectedIndex].text;
  console.log("Status dipilih:", statusText);

  let revisionStatus = "";

  if (lastRevision === 0 && statusText === oldStatusText) {
    revisionStatus = statusText;
  } else {
    const newRevision = lastRevision + 1;
    revisionStatus = `${statusText} R${newRevision}`;
  }

  console.log("Revision status:", revisionStatus); // cek hasilnya

  document.getElementById("revision_number").value = revisionStatus;
}

document.addEventListener("input", function (e) {
  if (e.target.classList.contains("formatRupiah")) {
    const angka = e.target.value.replace(/[^\d]/g, "");
    e.target.value = formatRupiah(angka);
  }
});

function formatRupiah(angka) {
  if (!angka) return "0";
  return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseNumber(input) {
  return parseInt(input.replace(/[^\d]/g, "")) || 0;
}

function hitungTotalInvoice() {
  const nominal = parseNumber(document.getElementById("contract_amount").value);
  const discount = parseNumber(document.getElementById("discount").value);
  const shipping = parseNumber(document.getElementById("shipping").value);
  const ppnPersen = parseFloat(
    document.getElementById("ppn_persen")?.value || 11
  );

  const dpp = nominal - discount;
  const ppn = Math.round((dpp * ppnPersen) / 100);
  const total = dpp + ppn + shipping;

  // Update form input
  document.getElementById("ppn").value = formatRupiah(ppn);
  document.getElementById("total").value = formatRupiah(total);

  // Update elemen ringkasan tampilan
  document.getElementById("subtotal").innerText = formatRupiah(nominal);
  document.getElementById("diskon").innerText = formatRupiah(discount);
  document.getElementById("pajak").innerText = formatRupiah(ppn);
  document.getElementById("total").innerText = formatRupiah(total);

  // Bisa diisi nilai default untuk ringkasan pembayaran (nanti bisa kamu ubah pas masuk ke bagian pembayaran)
  document.getElementById("paymentTotalInvoice").innerText =
    formatRupiah(total);
  document.getElementById("paymentTotalPaid").innerText = "0";
  document.getElementById("paymentRemaining").innerText = formatRupiah(total);
}

document.addEventListener("input", function (e) {
  const id = e.target.id;
  const isRelevant = ["contract_amount", "discount", "shipping"].includes(id);

  if (e.target.classList.contains("formatRupiah")) {
    const angka = e.target.value.replace(/[^\d]/g, "");
    e.target.value = formatRupiah(angka);
  }

  if (isRelevant) {
    hitungTotalInvoice();
  }
});

async function loadTermOfPayment(ownerId) {
  try {
    const response = await fetch(
      `${baseUrl}/table/finance_instruction_payment/${ownerId}/1`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      }
    );

    const result = await response.json();
    const data = result?.tableData;

    if (data && data.length > 0) {
      // Temukan item dengan instruction sesuai
      const selected = data.find(
        (item) => item.instruction === "Pembayaran 30% DP, 70% setelah selesai."
      );

      // Jika ditemukan, tampilkan di textarea
      if (selected) {
        document.getElementById("termPayment").value = selected.instruction;
      } else {
        document.getElementById("termPayment").value = "";
      }
    }
  } catch (error) {
    console.error("Gagal memuat Term of Payment:", error);
  }
}

// Panggil fungsi saat halaman siap
document.addEventListener("DOMContentLoaded", () => {
  loadTermOfPayment(owner_id);
});
