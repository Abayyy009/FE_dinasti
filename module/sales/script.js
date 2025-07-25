pagemodule = "sales";
colSpanCount = 8;
setDataType("sales");
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
    <tr class="hover:bg-gray-50 transition-colors cursor-pointer relative" onclick="toggleDropdown(event, ${index})">
      <td class="px-4 py-2 text-center">${globalIndex}</td>
      <td class="px-4 py-2">${item.tanggal}</td>
      <td class="px-4 py-2 space-y-1">
        <div class="text-gray-500 text-xs">${item.no_qtn}</div>
        <div class="font-medium">${item.project_name}</div>
        <div class="text-gray-500 text-xs">${item.user_nama}</div>
      </td>
      <td class="px-4 py-2">${item.project_type}</td>
      <td class="px-4 py-2 text-right">${item.total_order}</td>
      <td class="px-4 py-2">${item.pelanggan_nama}</td>
      <td class="px-4 py-2">
        <span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
  ${statusSalesMap[item.status] || "Unknown"}
</span>

      </td>
      <td class="px-6 py-4 text-center relative">
        <div id="dropdown-${index}" class="hidden absolute z-50 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div class="py-1">
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Details</a>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit</a>
            <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete</a>
            <div class="border-t border-gray-200 my-1"></div>
            <a href="#" class="block px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100">On Going</a>
            <a href="#" class="block px-4 py-2 text-sm text-green-600 hover:bg-gray-100">Won</a>
            <a href="#" class="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Lost</a>
          </div>
        </div>
      </td>
    </tr>
  `;
};

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

formHtml = `

<form id="dataform" class="space-y-4 text-center" enctype="multipart/form-data">
<input type="hidden" name="user_id" value="100" />
  <!-- Tanggal -->
  <div>
    <input type="date" id="tanggal" name="tanggal"
      class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700"
      placeholder="Tanggal Order" />
  </div>

  <!-- Tipe Proyek -->
  <!-- Tipe Proyek (Dynamic from API) -->
<div>
  <select id="project_type" onchange="generateNoQtn()" name="project_type"
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

  <!-- Total Order -->
  <div>
    <input id="amount" name="amount" type="number" placeholder="Fill Total Order"
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

function toggleDropdown(event, index) {
  event.stopPropagation();

  // Tutup dropdown lain dulu
  document.querySelectorAll('[id^="dropdown-"]').forEach((drop) => {
    drop.classList.add("hidden");
  });

  // Tampilkan dropdown yang diklik
  const dropdown = document.getElementById(`dropdown-${index}`);
  if (dropdown) {
    dropdown.style.left = event.clientX + "px";
    dropdown.style.top = event.clientY + "px";
    dropdown.classList.toggle("hidden");
  }
}

// Klik luar dropdown → tutup semua
document.addEventListener("click", () => {
  document.querySelectorAll('[id^="dropdown-"]').forEach((drop) => {
    drop.classList.add("hidden");
  });
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

async function generateNoQtn() {
  try {
    const prefix = "QT";
    const initialName = "DEI";

    const now = new Date();
    const tahun = now.getFullYear();
    const bulan = now.getMonth() + 1;
    const bulanRomawi = [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
    ][bulan - 1];

    // Ganti 100 sesuai owner_id-mu
    const lastNumberResponse = await fetch(
      `${baseUrl}/lastnumber/sales/${tahun}/100`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }
    );
    const lastNumberData = await lastNumberResponse.json();
    const noUrut = (lastNumberData.data.terakhir || 0) + 1;

    const selectedTypeId = parseInt(
      document.getElementById("project_type").value
    );
    const selectedType = typeList.find(
      (item) => item.type_id === selectedTypeId
    );
    const kodeType = selectedType?.kode_type || "XX";

    const noQtn = `${noUrut}/${prefix}/${kodeType}/${initialName}/${bulanRomawi}/${tahun}`;
    document.getElementById("no_qtn").value = noQtn;

    console.log("📄 Generated No QTN:", noQtn);
  } catch (error) {
    console.error("❌ Error generating No QTN:", error);
  }
}

statusSalesMap = {};

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

    if (result.status_response === "200") {
      result.data.forEach((statusObj) => {
        statusSalesMap[statusObj.status_id] = statusObj.status_sales;
      });
    }
  } catch (err) {
    console.error("Gagal mengambil status sales:", err);
  }
}
// const tanggalInput = document.getElementById("tanggal");

// if (tanggalInput) {
//   tanggalInput.addEventListener("change", function () {
//     const value = this.value; // yyyy-mm-dd
//     if (value) {
//       let hiddenInput = document.getElementById("tanggal_formatted");
//       if (!hiddenInput) {
//         hiddenInput = document.createElement("input");
//         hiddenInput.type = "hidden";
//         hiddenInput.id = "tanggal_formatted";
//         hiddenInput.name = "tanggal_formatted";
//         this.parentNode.appendChild(hiddenInput);
//       }

//       hiddenInput.value = value;
//       console.log("📆 Formatted Tanggal:", value);
//     }
//   });
// }
