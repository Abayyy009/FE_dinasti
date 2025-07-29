/*********************
 * CONFIG & GLOBALS
 *********************/
pagemodule = "Sales Detail";
console.log(pagemodule);
setDataType("sales_detail");

// Endpoint status (sesuaikan bila beda)
STATUS_ENDPOINT = "https://devdinasti.katib.cloud/status/sales";

STATUS_CACHE = null;
OLD_STATUS_LABEL = null; // label status lama (mis: "On Going", "WON", "LOSE")
OLD_STATUS_REV = null; // contoh: "WON R1", "LOSE R2"

/*********************
 * HELPERS
 *********************/
function setVal(id, value, mode = "value") {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[setVal] #${id} tidak ditemukan`);
    return false;
  }
  if (mode === "text") el.textContent = value ?? "";
  else el.value = value ?? "";
  console.log(`[setVal] #${id} <-`, value);
  return true;
}

function mustGetVal(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.error(`[submit] ❌ Element #${id} tidak ditemukan`);
    Swal.fire("Gagal", `Element #${id} tidak ditemukan di DOM`, "error");
    throw new Error(`Element #${id} not found`);
  }
  return el.value;
}

function getNum(id) {
  const v = parseFloat(mustGetVal(id) || "0");
  return isNaN(v) ? 0 : v;
}

// Normalisasi label status → UPPERCASE prefix untuk revision (WON/LOSE/ON GOING)

function normStatusLabel(label) {
  return (label || "").toString().trim().toUpperCase();
}

// Ambil angka revisi terakhir (R1, R2, ... atau " ... 2")
function parseRevisionNumber(rev) {
  if (!rev) return null;
  const m = String(rev).match(/(?:R\s*)?(\d+)\s*$/i);
  return m ? parseInt(m[1], 10) : null;
}

// Hitung revision baru saat status berubah
function computeNextRevision(
  oldRevision,
  /* oldStatusLabel (tak terpakai) */ _oldStatusLabel,
  newStatusLabel
) {
  const nextPrefix = normStatusLabel(newStatusLabel); // contoh: "ON GOING" / "WON" / "LOSE"
  const oldNum = parseRevisionNumber(oldRevision) || 0; // kalau belum ada, mulai dari 0
  const nextNum = oldNum + 1; // SELALU naik +1 saat simpan
  return `${nextPrefix} R${nextNum}`;
}

/*********************
 * STATUS DROPDOWN
 *********************/
async function loadStatusOptions(selectId = "editStatusId", selectedId = null) {
  try {
    if (!STATUS_CACHE) {
      const res = await fetch(STATUS_ENDPOINT, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      });
      const json = await res.json();
      STATUS_CACHE = json?.data || [];
    }
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = `<option value="">— Pilih Status —</option>`;
    STATUS_CACHE.forEach((st) => {
      const opt = document.createElement("option");
      opt.value = st.status_id;
      opt.textContent = st.status_sales;
      select.appendChild(opt);
    });

    if (
      selectedId != null &&
      STATUS_CACHE.some((s) => String(s.status_id) === String(selectedId))
    ) {
      select.value = String(selectedId);
    } else {
      // fallback: pilih opsi pertama non-empty
      if (select.options.length > 1) select.selectedIndex = 1;
    }
  } catch (err) {
    console.error("❌ loadStatusOptions error:", err);
    Swal.fire("Gagal", "Tidak dapat memuat daftar status", "error");
  }
}

/*********************
 * FETCH DETAIL
 *********************/
async function loadSalesDetail() {
  try {
    const response = await fetch(
      `https://devdinasti.katib.cloud/detail/sales/${pesanan_id}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` } }
    );
    if (!response.ok) throw new Error("Failed to fetch sales detail");

    const result = await response.json();
    const data = result.data;

    // Header
    document.getElementById("quotationDate").textContent = data.tanggal || "-";
    document.getElementById("quotationNumber").textContent = data.no_qtn || "-";
    document.getElementById("quotationRev").textContent =
      data.status_revision || data.revision_status || "-";

    // Project Info
    document.getElementById("clientName").textContent = data.user_nama || "-";
    document.getElementById("projectName").textContent = `Project: ${
      data.project_name || "-"
    }`;
    document.getElementById("companyName").textContent =
      data.pelanggan_nama || "-";

    // Items
    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";
    (data.items || []).forEach((item, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="px-4 py-2 border text-center">${index + 1}</td>
        <td class="px-4 py-2 border">${item.description ?? ""}</td>
        <td class="px-4 py-2 border text-center">${item.qty ?? ""}</td>
        <td class="px-4 py-2 border text-center">${item.unit ?? ""}</td>
        <td class="px-4 py-2 border text-right">Rp ${(
          item.unit_price ?? 0
        ).toLocaleString("id-ID")}</td>
        <td class="px-4 py-2 border text-right">Rp ${(
          item.total ?? 0
        ).toLocaleString("id-ID")}</td>
      `;
      tableBody.appendChild(row);
    });

    // Totals
    document.getElementById("subtotal").textContent = `Rp ${(
      data.subtotal ?? 0
    ).toLocaleString("id-ID")}`;
    document.getElementById("disc").textContent = `Rp ${(
      data.disc ??
      data.discount ??
      0
    ).toLocaleString("id-ID")}`;
    document.getElementById("shipping").textContent = `Rp ${(
      data.shipping ?? 0
    ).toLocaleString("id-ID")}`;
    document.getElementById("ppn").textContent = `Rp ${(
      data.ppn ?? 0
    ).toLocaleString("id-ID")}`;
    document.getElementById("total").textContent = `Rp ${(
      data.total ?? 0
    ).toLocaleString("id-ID")}`;
  } catch (error) {
    console.error("❌ Error loading sales detail:", error);
  }
}

/*********************
 * UPDATE (PUT)
 *********************/
async function updateSalesDetail(pesanan_id, payload) {
  const updateUrl = `https://devdinasti.katib.cloud/update/sales/${pesanan_id}`;
  try {
    const response = await fetch(updateUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Update failed");
    console.log("✅ Sales detail updated:", result);
    Swal.fire("Berhasil", "Data berhasil diperbarui", "success");
  } catch (error) {
    console.error("❌ Error updating sales detail:", error);
    Swal.fire("Gagal", error.message || "Terjadi kesalahan", "error");
  }
}

/*********************
 * EDIT MODAL
 *********************/
function openEditModal(data) {
  console.group("[openEditModal]");
  console.log("data:", data);

  const modal = document.getElementById("editSalesModal");
  if (!modal) {
    console.error("[openEditModal] ❌ #editSalesModal tidak ada");
    console.groupEnd();
    return;
  }
  modal.classList.remove("hidden");

  // Simpan status lama
  OLD_STATUS_LABEL = data.status ?? data.status_sales ?? ""; // label lama
  OLD_STATUS_REV = data.status_revision ?? data.revision_status ?? "";

  // Locked fields (tampil tapi tidak bisa diubah)
  const ownerId = data.owner_id ?? 100;
  const userId = data.user_id ?? 100;
  const noQtn = data.no_qtn ?? "";
  const typeId = data.type_id ?? data?.type?.id ?? 2;
  const orderDt = data.order_date ?? data.tanggal ?? "";

  setVal("editOwnerId", ownerId);
  setVal("editUserId", userId);
  setVal("editNoQtn", noQtn);
  setVal("editTypeId", typeId);
  setVal("editOrderDate", orderDt);
  setVal("editPesananId", data.pesanan_id);

  // Editable fields
  setVal("editProjectName", data.project_name ?? "");
  setVal("editPelangganNama", data.pelanggan_nama ?? data.client ?? "");
  setVal("editTanggal", data.tanggal ?? orderDt);
  setVal("editContractAmount", data.contract_amount ?? 0);
  setVal("editDisc", data.disc ?? data.discount ?? 0);
  setVal("editShipping", data.shipping ?? 0);
  setVal("editPpn", data.ppn ?? 0);
  setVal("editTotal", data.total ?? 0);

  // Status dropdown + revision
  loadStatusOptions("editStatusId", data.status_id ?? 1).then(() => {
    const statusSelect = document.getElementById("editStatusId");
    const currentLabel =
      statusSelect?.options[statusSelect.selectedIndex]?.text ??
      OLD_STATUS_LABEL;

    const initialRev = OLD_STATUS_REV || `${normStatusLabel(currentLabel)} R1`;
    setVal("editStatusRevision", initialRev);

    if (statusSelect) {
      statusSelect.onchange = () => {
        const newLabel =
          statusSelect.options[statusSelect.selectedIndex]?.text ?? "";
        const next = computeNextRevision(
          OLD_STATUS_REV,
          OLD_STATUS_LABEL,
          newLabel
        );
        setVal("editStatusRevision", next);
      };
    }
  });

  // Items
  const container = document.getElementById("itemContainer");
  if (!container) {
    console.warn("[openEditModal] ❗ #itemContainer tidak ada");
  } else {
    container.innerHTML = "";
    (Array.isArray(data.items) ? data.items : []).forEach((it, i) =>
      addItemField(it)
    );
  }

  console.groupEnd();
}

function closeEditModal() {
  document.getElementById("editSalesModal").classList.add("hidden");
}

/*********************
 * FORM SUBMIT
 *********************/
document
  .getElementById("editSalesForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    console.group("[submit editSalesForm]");

    // Kumpulkan items
    const items = Array.from(
      document.querySelectorAll("#itemContainer > div")
    ).map((row) => {
      const inputs = row.querySelectorAll("input");
      const item = {};
      inputs.forEach((input) => {
        const key = input.dataset.field;
        const value =
          input.type === "number"
            ? parseFloat(input.value || "0")
            : input.value;
        item[key] = value;
      });
      return item;
    });

    try {
      const pesananId = mustGetVal("editPesananId");

      // Ambil label status TERPILIH saat ini
      const statusSelect = document.getElementById("editStatusId");
      const currentStatusLabel =
        statusSelect && statusSelect.selectedIndex >= 0
          ? statusSelect.options[statusSelect.selectedIndex].text
          : "";

      // ✅ Revisi baru: SELALU +1 dari revisi lama, prefix = status saat ini
      const nextRevision = computeNextRevision(
        OLD_STATUS_REV, // dari openEditModal
        OLD_STATUS_LABEL, // tidak dipakai, tetap kirim agar signature sama
        currentStatusLabel
      );

      // (Opsional) tampilkan ke input preview agar user lihat apa yang akan tersimpan
      setVal("editStatusRevision", nextRevision);

      const payload = {
        owner_id: parseInt(mustGetVal("editOwnerId"), 10),
        user_id: parseInt(mustGetVal("editUserId"), 10),
        no_qtn: mustGetVal("editNoQtn"),
        type_id: parseInt(mustGetVal("editTypeId"), 10),
        order_date: mustGetVal("editOrderDate"),

        project_name: mustGetVal("editProjectName"),
        client: mustGetVal("editPelangganNama"),

        contract_amount: getNum("editContractAmount"),
        discount: getNum("editDisc"), // mapping dari 'disc'
        shipping: getNum("editShipping"),
        ppn: getNum("editPpn"),

        status_id: parseInt(mustGetVal("editStatusId"), 10),
        status_revision: nextRevision, // ✅ pakai revisi BARU hasil hitung di atas

        file: "",
        items: items.map(({ description, qty, unit, unit_price }) => ({
          description,
          qty: parseFloat(qty || "0"),
          unit,
          unit_price: parseFloat(unit_price || "0"),
        })),
      };

      console.log("[submit] payload:", payload);

      await updateSalesDetail(pesananId, payload);
      closeEditModal();
      await loadSalesDetail();
    } catch (err) {
      console.error("[submit] ❌ Error:", err);
    } finally {
      console.groupEnd();
    }
  });

/*********************
 * ITEMS UI
 *********************/
function addItemField(item = {}) {
  const container = document.getElementById("itemContainer");
  const wrapper = document.createElement("div");
  wrapper.className = "grid grid-cols-5 gap-2 items-center";
  wrapper.innerHTML = `
    <input type="text" class="border p-2 rounded" placeholder="Description" value="${
      item.description || ""
    }" data-field="description" />
    <input type="number" class="border p-2 rounded" placeholder="Qty" value="${
      item.qty || 1
    }" data-field="qty" />
    <input type="text" class="border p-2 rounded" placeholder="Unit" value="${
      item.unit || "pcs"
    }" data-field="unit" />
    <input type="number" class="border p-2 rounded" placeholder="Unit Price" value="${
      item.unit_price || 0
    }" data-field="unit_price" />
    <input type="number" class="border p-2 rounded" placeholder="Total (opsional)" value="${
      item.total || 0
    }" data-field="total" />
  `;
  container.appendChild(wrapper);
}

/*********************
 * INIT
 *********************/
document.getElementById("addButton").addEventListener("click", () => {
  showFormModal();
  loadProjectType?.();
  loadDropdownCall?.();
});

console.log(pesanan_id);
loadSalesDetail();

// Opsional: tombol "Edit" Anda bisa panggil loadDetailAndEdit()
async function loadDetailAndEdit() {
  try {
    const res = await fetch(
      `https://devdinasti.katib.cloud/detail/sales/${pesanan_id}`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }
    );
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    openEditModal(result.data);
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Tidak dapat mengambil detail", "error");
  }
}
