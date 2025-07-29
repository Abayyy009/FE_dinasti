pagemodule = "sales";
colSpanCount = 8;
setDataType("sales");
window.statusSalesMap = {};
async function init() {
  await loadStatusSalesMap(); // ambil data status -> status_id: status_sales
  fetchAndUpdateData(); // lalu fetch data utama
}
init();

typeList = [];

document.getElementById("addButton").addEventListener("click", () => {
  showFormModal(); // Tampilkan form modal
  loadProjectType(); // Baru ambil dan isi dropdown setelah form ada
  loadDropdownCall();
});

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  return `
    <tr class="hover:bg-gray-50 transition-colors cursor-pointer relative row-click-target" data-index="${index}" onclick="toggleDropdown(event, ${index})">
      <td class="px-4 py-2 text-center">${globalIndex}</td>
      <td class="px-4 py-2">${item.tanggal}</td>
      <td class="px-4 py-2 space-y-1">
        <div class="text-gray-500 text-xs">${item.no_qtn}</div>
        <div class="font-medium">${item.project_name}</div>
        <div class="text-gray-500 text-xs">${item.user_nama}</div>
      </td>
      <td class="px-4 py-2">${item.project_type}</td>
      <td class="px-4 py-2 text-right">
  ${formatRupiah(item?.contract_amount)}
</td>


      <td class="px-4 py-2">${item.pelanggan_nama}</td>
      <td class="px-4 py-2 relative">
        <span class="${getStatusColorClass(
          item.status_id
        )} px-2 py-1 rounded text-xs">
        ${window.statusSalesMap[Number(item.status_id)] || "Unknown"}
      </span>


        <div class="dropdown-menu dropdown-menu-${index} hidden absolute right-0 mt-2 z-50 w-44 bg-white border border-gray-200 rounded-md shadow-lg">
          <a href="#"
          onclick="event.stopPropagation(); loadModuleContent('sales_detail', '${
            item.pesanan_id
          }');"
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          View Details
        </a>
          <a onclick="event.stopPropagation(); handleDelete(${
            item.pesanan_id
          })" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete</a>
      </td>
     <td class="px-4 py-2">${item.revision_status || item.revision_number}</td>

    </tr>
  `;
};

async function updateStatus(pesananId, newStatus, index) {
  const updateUrl = `${baseUrl}/update/status_sales/${pesananId}`;
  const bodyData = JSON.stringify({
    status_id: newStatus,
    revision_status: `Revisi ${Date.now()}`, // bisa dynamic atau kosong jika tidak perlu
  });

  try {
    const response = await fetch(updateUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: bodyData,
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Status updated:", result);

      // Update label status
      const dropdown = document.querySelector(`.dropdown-menu-${index}`);
      if (dropdown) {
        const statusSpan = dropdown.parentElement.querySelector("span");
        if (statusSpan) {
          statusSpan.textContent =
            window.statusSalesMap[newStatus] || "Unknown";

          statusSpan.className = "";
          statusSpan.classList.add("px-2", "py-1", "rounded", "text-xs");
          statusSpan.classList.add(
            ...getStatusColorClass(newStatus).split(" ")
          );
        }
        dropdown.classList.add("hidden");
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Status berhasil diperbarui.",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      console.error("❌ Gagal update status", result);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: result.message || "Gagal memperbarui status.",
      });
    }
  } catch (error) {
    console.error("❌ Error update status:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Terjadi kesalahan saat mengubah status.",
    });
  }
}

function getStatusColorClass(status) {
  switch (Number(status)) {
    case 1:
      return "bg-yellow-100 text-yellow-700";
    case 2:
      return "bg-green-100 text-green-700";
    case 3:
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

formHtml = `

<form id="dataform" class="space-y-4 text-center" enctype="multipart/form-data">
<input type="hidden" name="user_id" value="100" />
  <!-- Tanggal -->
  <div>
    <input type="date" id="tanggal" name="tanggal"
  class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700"
  placeholder="Tanggal Order"
  onchange="generateNoQtn()" />

  </div>

  <!-- Tipe Proyek -->
  <!-- Tipe Proyek (Dynamic from API) -->
<div>
  <select id="project_type" onchange="generateNoQtn()" name="type_id"
    class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700">
    <option value="">Select The Project Type</option>
    <!-- Dynamic Options Here -->
  </select>
</div>


  <!-- Nomor Quotation -->
  <div>
    <input  id="no_qtn" name="no_qtn" type="text" placeholder="Generate Quotation Number"
      class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" readonly />
  </div>

  <!-- Nama Proyek -->
  <div>
    <input id="project_name" name="project_name" type="text" placeholder="Fill The Project Name"
      class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
  </div>

  <!-- Nama Client -->
  <div>
    <input id="client" name="client" type="text" placeholder="Who's The Client?"
      class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
  </div>

  <!-- Upload File -->
  <div class="text-left text-sm text-red-500">Only .xlsx extension is allowed</div>
  <div>
    <input id="file" name="file" type="file" accept=".xlsx"
      class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
  </div>
</form>`;

function fillFormData(data) {
  document.getElementById("tanggal").value = data.tanggal || "";

  document.getElementById("project_type").value = data.project_type || "";
  generateNoQtn(); // Panggil ulang agar no_qtn bisa tergenerate ulang sesuai tipe jika perlu

  document.getElementById("no_qtn").value = data.no_qtn || "";
  document.getElementById("project_name").value = data.project_name || "";
  document.getElementById("amount").value = data.amount || "";
  document.getElementById("pelanggan_nama").value = data.pelanggan_nama || "";

  // File input tidak bisa di-set value-nya lewat JavaScript karena alasan keamanan.
  // Jadi kamu bisa tampilkan info file secara terpisah (misal nama file-nya) jika ingin.
}

window.toggleDropdown = function (event, index) {
  if (event && typeof event.stopPropagation === "function") {
    event.stopPropagation();
  }

  // Sembunyikan semua dropdown lain
  document.querySelectorAll(".dropdown-menu").forEach((el, i) => {
    if (!el.classList.contains(`dropdown-menu-${index}`)) {
      el.classList.add("hidden");
    }
  });

  const dropdown = document.querySelector(`.dropdown-menu-${index}`);
  if (!dropdown) {
    console.warn("❗ dropdown not found for index:", index);
    return;
  }

  // Toggle dropdown target
  dropdown.classList.toggle("hidden");
};

// Tutup dropdown saat klik di luar
document.addEventListener("click", (event) => {
  if (
    !event.target.closest(".dropdown-menu") &&
    !event.target.closest("tr.row-click-target")
  ) {
    document.querySelectorAll(".dropdown-menu").forEach((el) => {
      el.classList.add("hidden");
    });
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const select = document.getElementById("project_type");
  console.log("🔍 Select element found:", select);

  try {
    const response = await fetch("https://devdinasti.katib.cloud/type/sales");
    const result = await response.json();

    console.log("📦 Fetched result:", result);

    if (result.status_response === "200" && Array.isArray(result.data)) {
      result.data.forEach((type) => {
        console.log("🧩 Adding type:", type);

        const option = document.createElement("option");
        option.value = type.kode_type.trim();
        option.textContent = type.nama_type.trim();
        select.appendChild(option);
      });
    } else {
      console.error(
        "❌ Failed to load project types:",
        result.message || result
      );
    }
  } catch (error) {
    console.error("🔥 Error fetching project types:", error);
  }
});

async function loadProjectType() {
  try {
    const response = await fetch(`https://devdinasti.katib.cloud/type/sales`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const result = await response.json();

    typeList = result.data;

    const select = document.getElementById("project_type");
    select.innerHTML = "<option disabled selected>Pilih Type</option>";

    result.data.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.type_id;
      option.textContent = `${item.nama_type} (${item.kode_type})`; // ← ini perubahan utamanya
      select.appendChild(option);
    });

    console.log("✅ Project type loaded:", typeList);
  } catch (error) {
    console.error("❌ Gagal load project type:", error);
  }
}

async function loadStatusSalesMap() {
  try {
    const response = await fetch(
      `https://devdinasti.katib.cloud/status/sales`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }
    );
    const result = await response.json();

    if (result.response === "200") {
      result.data.forEach((statusObj) => {
        window.statusSalesMap[Number(statusObj.status_id)] =
          statusObj.status_sales;
      });
      console.log("✅ Status sales map loaded:", window.statusSalesMap);
    } else {
      console.error("❌ Gagal load status sales:", result.message);
    }
  } catch (err) {
    console.error("🔥 Gagal mengambil status sales:", err);
  }
}

document.getElementById("tanggal").addEventListener("change", generateNoQtn);
document
  .getElementById("project_type")
  .addEventListener("change", generateNoQtn);

async function generateNoQtn() {
  const tanggal = document.getElementById("tanggal").value;
  const typeId = document.getElementById("project_type").value;
  const userId = document.querySelector("input[name='user_id']").value;
  const ownerId = 100;

  if (!tanggal || !typeId) {
    document.getElementById("no_qtn").value = "";
    return;
  }

  try {
    const response = await fetch(
      "https://devdinasti.katib.cloud/generate/noqtn",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          order_date: tanggal,
          type_id: typeId,
          user_id: parseInt(userId),
          owner_id: ownerId,
        }),
      }
    );

    if (!response.ok) throw new Error("Gagal generate");

    const data = await response.json();
    document.getElementById("no_qtn").value = data.data?.no_qtn || "Gagal";
  } catch (err) {
    console.error("Error:", err);
    document.getElementById("no_qtn").value = "Error";
  }
}

async function loadStatusSalesMap() {
  try {
    const response = await fetch(
      `https://devdinasti.katib.cloud/status/sales`,
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      }
    );
    const result = await response.json();

    if (result.response === "200") {
      result.data.forEach((statusObj) => {
        // Gunakan Number sebagai key
        statusSalesMap[Number(statusObj.status_id)] = statusObj.status_sales;
      });
      console.log("✅ Status sales map loaded:", statusSalesMap);
    } else {
      console.error("❌ Gagal load status sales:", result.message);
    }
  } catch (err) {
    console.error("🔥 Gagal mengambil status sales:", err);
  }
}
function formatRupiah(value, { fallback = "-", withCents = false } = {}) {
  // Null/undefined → tampilkan fallback
  if (value === null || value === undefined) return fallback;

  // Jika string, bersihkan karakter non-angka (mis. "Rp 1.500.000")
  let num = value;
  if (typeof value === "string") {
    // ubah "1.500.000,50" → "1500000.50"
    const cleaned = value
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    num = Number(cleaned);
  } else {
    num = Number(value);
  }

  if (!Number.isFinite(num)) return fallback;

  const opts = { style: "currency", currency: "IDR" };
  if (!withCents) {
    opts.minimumFractionDigits = 0;
    opts.maximumFractionDigits = 0;
  }

  return new Intl.NumberFormat("id-ID", opts).format(num);
}
