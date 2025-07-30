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

    // Header tampilan
    document.getElementById("quotationDate").textContent = data.tanggal || "-";
    document.getElementById("quotationNumber").textContent = data.no_qtn || "-";
    document.getElementById("quotationRev").textContent =
      data.status_revision || data.revision_status || "-";

    document.getElementById("clientName").textContent = data.user_nama || "-";
    document.getElementById("projectName").textContent = `Project: ${
      data.project_name || "-"
    }`;
    document.getElementById("companyName").textContent =
      data.pelanggan_nama || "-";

    // Items (inline editable)
    renderEditableItems(data.items || []);

    // Tampilkan angka dari server dulu
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

    // ✅ SIMPAN DETAIL TERAKHIR UNTUK INLINE SAVE
    window.CURRENT_DETAIL = {
      pesanan_id: data.pesanan_id,
      owner_id: data.owner_id ?? 100,
      user_id: data.user_id ?? 100,
      no_qtn: data.no_qtn ?? "",
      project_name: data.project_name ?? "",
      client: data.client ?? data.pelanggan_nama ?? "",
      type_id: data.type_id ?? data?.type?.id ?? 2,
      order_date: data.order_date ?? data.tanggal ?? "",
      status_id: data.status_id ?? 1,
      status_revision: data.status_revision ?? data.revision_status ?? "",
      discount: data.discount ?? data.disc ?? 0,
      shipping: data.shipping ?? 0,
      ppn: data.ppn ?? 0,
    };

    // (Opsional) sediakan hidden fallback (kalau kamu pakai builder baca dari DOM)
    ensureHeaderHiddenFieldsFromDetail(window.CURRENT_DETAIL);
  } catch (error) {
    console.error("❌ Error loading sales detail:", error);
  }
}

function ensureHeaderHiddenFieldsFromDetail(detail) {
  let box = document.getElementById("hiddenHeaderBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "hiddenHeaderBox";
    box.style.display = "none";
    document.body.appendChild(box);
  }
  const setHidden = (id, value) => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("input");
      el.type = "hidden";
      el.id = id;
      box.appendChild(el);
    }
    el.value = value === "-" || value == null ? "" : String(value);
  };

  setHidden("editPesananId", detail.pesanan_id);
  setHidden("editOwnerId", detail.owner_id);
  setHidden("editUserId", detail.user_id);
  setHidden("editNoQtn", detail.no_qtn);
  setHidden("editTypeId", detail.type_id);
  setHidden("editOrderDate", detail.order_date);
  setHidden("editProjectName", detail.project_name);
  setHidden("editPelangganNama", detail.client);
  setHidden("editStatusId", detail.status_id);
  setHidden("editStatusRevision", detail.status_revision);
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
      { headers: { Authorization: `Bearer ${API_TOKEN}` } }
    );
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    // timpa items dari tabel (jika ada perubahan)
    const inlineItems = collectInlineItems();
    if (inlineItems.length) {
      result.data.items = inlineItems;
    }
    openEditModal(result.data);
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Tidak dapat mengambil detail", "error");
  }
}

/*********************
 * INLINE TABLE (Items)
 *********************/

// Format & parse
function fmtIDR(n) {
  const v = Number(n || 0);
  return "Rp " + v.toLocaleString("id-ID");
}
function unformatNumber(str) {
  if (str === "-" || str == null) return 0;
  return Number(String(str).replace(/[^\d.]/g, "")) || 0;
}
function dash(v) {
  return v === undefined || v === null || v === "" ? "-" : v;
}

// Render tabel editable
function renderEditableItems(items) {
  // Renumber ulang baris setelah hapus/tambah
  function renumberRows() {
    document.querySelectorAll("#tableBody tr").forEach((tr, i) => {
      const noCell = tr.querySelector("td:first-child");
      if (noCell) noCell.textContent = i + 1;
    });
  }

  // Init tombol
  document.getElementById("addRowButton")?.addEventListener("click", () => {
    addEditableRow({}, document.querySelectorAll("#tableBody tr").length + 1);
  });

  document
    .getElementById("saveInlineButton")
    ?.addEventListener("click", async () => {
      try {
        const payload = buildUpdatePayloadFromDOM();
        const missing = validateRequired(payload);
        if (missing.length) {
          console.warn("Missing fields:", missing);
          Swal.fire(
            "Data kurang",
            `Field wajib belum lengkap: ${missing.join(", ")}`,
            "warning"
          );
          return;
        }
        console.log("[inline-save] payload:", payload);
        await updateSalesDetail(
          window.CURRENT_DETAIL?.pesanan_id || pesanan_id,
          payload
        );
        await loadSalesDetail(); // refresh dan refresh CURRENT_DETAIL
      } catch (err) {
        console.error(err);
        Swal.fire("Gagal", err.message || "Gagal menyimpan perubahan", "error");
      }
    });

  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  items.forEach((item, i) => addEditableRow(item, i + 1));

  // Delegasi event untuk recalculation (qty/unit_price/total berubah)
  tbody.addEventListener("input", onTableInput);
  tbody.addEventListener("focusin", onCurrencyFocus);
  tbody.addEventListener("focusout", onCurrencyBlur);
}

// Tambah satu baris editable
function addEditableRow(item = {}, displayIndex) {
  const tbody = document.getElementById("tableBody");
  const qty = dash(item.qty);
  const unit = dash(item.unit || "pcs");
  const unitPrice = dash(item.unit_price);
  const initialTotal =
    item.total != null
      ? item.total
      : Number(item.qty || 0) * Number(item.unit_price || 0);

  const tr = document.createElement("tr");
  tr.className = "border-b";
  tr.innerHTML = `
    <td class="px-4 py-2 border text-center">${displayIndex}</td>

    <td class="px-4 py-2 border">
      <input class="border p-1 w-full" data-field="description" value="${dash(
        item.description
      )}" placeholder="-" />
    </td>

    <td class="px-4 py-2 border text-center">
      <input class="border p-1 w-16 text-center" data-field="qty" value="${qty}" placeholder="-" />
    </td>

    <td class="px-4 py-2 border text-center">
      <input class="border p-1 w-20 text-center" data-field="unit" value="${unit}" placeholder="-" />
    </td>

    <td class="px-4 py-2 border text-right">
      <input class="border p-1 w-32 text-right currency" data-field="unit_price" value="${
        unitPrice === "-" ? "-" : fmtIDR(unitPrice)
      }" placeholder="-" />
    </td>

    <td class="px-4 py-2 border text-right">
      <input class="border p-1 w-32 text-right currency" data-field="total" value="${
        initialTotal ? fmtIDR(initialTotal) : "-"
      }" placeholder="-" />
    </td>

    <td class="px-4 py-2 border text-center">
      <button class="text-red-600 hover:underline delete-row">🗑 Hapus</button>
    </td>
  `;
  // mark total auto jika dari perhitungan
  const totalEl = tr.querySelector('[data-field="total"]');
  if (totalEl && item.total == null) {
    totalEl.dataset.auto = "1";
  }
  tbody.appendChild(tr);

  // Bind tombol hapus
  const delBtn = tr.querySelector(".delete-row");
  delBtn.addEventListener("click", () => {
    tr.remove();
    renumberRows();
    recalcSubtotalFromTable();
    recalcGrandTotal();
  });
}

// Saat input berubah di tabel
function onTableInput(e) {
  const input = e.target;
  if (!input.dataset || !input.closest("tr")) return;

  const tr = input.closest("tr");
  const field = input.dataset.field;

  // Kalau user mengetik di kolom total → mark as manual (bukan auto)
  if (field === "total") {
    input.dataset.auto = ""; // manual override
    recalcSubtotalFromTable();
    recalcGrandTotal();
    return;
  }

  // Kalau qty/unit_price berubah → hitung ulang total hanya bila total masih auto atau "-"
  if (field === "qty" || field === "unit_price") {
    const totalEl = tr.querySelector('[data-field="total"]');
    if (!totalEl) return;

    const isAuto =
      totalEl.dataset.auto === "1" ||
      totalEl.value === "-" ||
      totalEl.value === "";
    if (isAuto) {
      const qtyEl = tr.querySelector('[data-field="qty"]');
      const upEl = tr.querySelector('[data-field="unit_price"]');
      const qty = unformatNumber(qtyEl.value);
      const up = unformatNumber(upEl.value);
      const total = qty * up;
      totalEl.value = total ? fmtIDR(total) : "-";
      totalEl.dataset.auto = "1"; // tetap di auto mode
    }
    recalcSubtotalFromTable();
    recalcGrandTotal();
  }
}

// Format rupiah saat blur, hilangkan format saat focus (biar enak diketik)
function onCurrencyFocus(e) {
  const input = e.target;
  if (!input.classList.contains("currency")) return;
  if (input.value === "-" || input.value === "") return;
  input.value = unformatNumber(input.value); // jadikan angka polos
}
function onCurrencyBlur(e) {
  const input = e.target;
  if (!input.classList.contains("currency")) return;
  if (input.value === "" || input.value === "-") {
    input.value = "-";
    return;
  }
  const n = unformatNumber(input.value);
  input.value = n ? fmtIDR(n) : "-";
}

// Hitung subtotal dari tabel (menjumlah kolom total)
function recalcSubtotalFromTable() {
  const totals = document.querySelectorAll('#tableBody [data-field="total"]');
  let sum = 0;
  totals.forEach((inp) => {
    sum += unformatNumber(inp.value);
  });
  const subtotalEl = document.getElementById("subtotal");
  if (subtotalEl) subtotalEl.textContent = fmtIDR(sum);
}

// Hitung TOTAL keseluruhan = subtotal - disc + shipping + ppn (pakai tampilan sekarang)
function recalcGrandTotal() {
  const subtotal = unformatNumber(
    document.getElementById("subtotal")?.textContent
  );
  const disc = unformatNumber(document.getElementById("disc")?.textContent);
  const shipping = unformatNumber(
    document.getElementById("shipping")?.textContent
  );
  const ppn = unformatNumber(document.getElementById("ppn")?.textContent);
  const total = subtotal - disc + shipping + ppn;
  const totalEl = document.getElementById("total");
  if (totalEl) totalEl.textContent = fmtIDR(total);
}

// (Untuk step berikutnya: ambil item dari tabel buat payload PUT)
function collectInlineItems() {
  const rows = document.querySelectorAll("#tableBody tr");
  return Array.from(rows).map((tr) => {
    const description =
      tr.querySelector('[data-field="description"]')?.value ?? "-";
    const qty = tr.querySelector('[data-field="qty"]')?.value ?? "-";
    const unit = tr.querySelector('[data-field="unit"]')?.value ?? "-";
    const up = tr.querySelector('[data-field="unit_price"]')?.value ?? "-";
    const total = tr.querySelector('[data-field="total"]')?.value ?? "-";
    return {
      description: description === "-" ? "" : description,
      qty: unformatNumber(qty),
      unit: unit === "-" ? "" : unit,
      unit_price: unformatNumber(up),
      total: unformatNumber(total),
    };
  });
}
// (Opsional) debouncing biar gak spam PUT
autosaveTimer = null;

document.getElementById("tableBody").addEventListener("focusout", async (e) => {
  if (e.target.tagName !== "INPUT") return;

  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(async () => {
    try {
      const payload = buildUpdatePayloadFromDOM(); // ✅ payload lengkap
      const missing = validateRequired(payload);
      if (missing.length) {
        console.warn("[auto-save] missing:", missing);
        return; // jangan PUT kalau belum lengkap (misal load belum selesai)
      }
      console.log("[auto-save] payload:", payload);
      await updateSalesDetail(
        window.CURRENT_DETAIL?.pesanan_id || pesanan_id,
        payload
      );
      // optional: refresh tampilan
      await loadSalesDetail();
    } catch (err) {
      console.error("[auto-save] error:", err);
    }
  }, 300); // 300ms setelah user selesai keluar dari input
});

function calcSubtotalFromItems(items) {
  return (items || []).reduce((sum, it) => {
    const base = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
    // kalau user sudah isi total manual, pakai itu
    return sum + (it.total ? Number(it.total) : base);
  }, 0);
}

function buildUpdatePayloadFromDOM() {
  const base = window.CURRENT_DETAIL || {};
  const items = collectInlineItems();
  const subtotal = calcSubtotalFromItems(items);

  // Ambil nilai tampilan disc/shipping/ppn yang ada sekarang (kalau ada di header)
  const disc = unformatNumber(document.getElementById("disc")?.textContent);
  const shipping = unformatNumber(
    document.getElementById("shipping")?.textContent
  );
  const ppn = unformatNumber(document.getElementById("ppn")?.textContent);

  // status_revision: biarkan nilai berjalan (atau pakai yang ada di header)
  const statusIdEl = document.getElementById("editStatusId");
  const status_id = statusIdEl
    ? parseInt(statusIdEl.value || base.status_id || 1, 10)
    : base.status_id || 1;
  const status_revision =
    document.getElementById("editStatusRevision")?.value ||
    base.status_revision ||
    "";

  // Payload LENGKAP sesuai endpoint update
  const payload = {
    owner_id: base.owner_id,
    user_id: base.user_id,
    no_qtn: base.no_qtn,
    project_name: base.project_name,
    client: base.client,
    type_id: base.type_id,
    order_date: base.order_date,

    contract_amount: subtotal, // kontrak = subtotal items (atau ganti sesuai kebijakanmu)
    discount: disc, // endpoint minta 'discount'
    shipping: shipping,
    ppn: ppn,

    status_id: status_id,
    status_revision: status_revision,

    file: "",
    items: items.map(({ description, qty, unit, unit_price }) => ({
      description,
      qty,
      unit,
      unit_price,
    })),
  };
  return payload;
}

function validateRequired(payload) {
  const required = [
    "owner_id",
    "user_id",
    "no_qtn",
    "project_name",
    "client",
    "type_id",
    "order_date",
    "contract_amount",
    "status_id",
  ];
  const missing = required.filter((k) => {
    const v = payload[k];
    return (
      v === undefined ||
      v === null ||
      v === "" ||
      (typeof v === "number" && isNaN(v))
    );
  });
  return missing;
}
addBtn = document.getElementById("addRowButton");
if (addBtn) {
  addBtn.onclick = () => {
    addEditableRow({}, document.querySelectorAll("#tableBody tr").length + 1);
  };
}

saveBtn = document.getElementById("saveInlineButton");
if (saveBtn) {
  saveBtn.onclick = async () => {
    try {
      const payload = buildUpdatePayloadFromDOM();
      const missing = validateRequired(payload);
      if (missing.length) {
        Swal.fire(
          "Data kurang",
          `Field wajib belum lengkap: ${missing.join(", ")}`,
          "warning"
        );
        return;
      }
      console.log("[inline-save] payload:", payload);
      await updateSalesDetail(
        window.CURRENT_DETAIL?.pesanan_id || pesanan_id,
        payload
      );
      await loadSalesDetail();
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", err.message || "Gagal menyimpan perubahan", "error");
    }
  };
}
