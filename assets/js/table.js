let dataItems = null;
let colSpanCount = null;
let currentDataType = null;
let debounceTimeout;
let accountOptions = [];
let itemCounter = 0;
let daftarKlien = [];
let customerList = [];
let produkList = [];
let regionList = [];

function setDataType(type) {
  currentDataType = type;
}

function debounceSearch() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    searchData();
  }, 500);
}

async function searchData() {
  const searchInput = document.getElementById("searchInput").value;

  try {
    if (searchInput.length > 0) {
      currentDataSearch = searchInput;
    } else {
      currentDataSearch = "";
    }

    fetchAndUpdateData(detail_id);
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

// ---------------------------------------
// LOAD DATA FUNCTIONS
// ---------------------------------------

async function fetchAndUpdateData(id = null) {
  const tableBodyId = "tableBody";
  showLoadingSpinner(document.querySelector(`#${tableBodyId}`));

  try {
    const response = await fetchData(
      currentDataType,
      state[currentDataType].currentPage,
      id
    );
    console.log("[fetchAndUpdateData] Fetched Response:", response);

    if (
      !response ||
      !Array.isArray(response.tableData) ||
      response.tableData.length === 0
    ) {
      console.warn("[fetchAndUpdateData] No tableData in response");
      throw new Error("Invalid or empty response from the API");
    }

    // Simpan data ke state
    dataItems = response.tableData;
    state[currentDataType].totalRecords = response.totalRecords || 0;
    state[currentDataType].totalPages = response.totalPages || 1;
    state[currentDataType].currentPage = response.currentPage || 1;

    setTimeout(() => {
      console.log("[fetchAndUpdateData] Calling loadData()...");
      loadData(); // Pastikan loadData pakai dataItems
      updatePagination(); // Pastikan pagination-nya sesuai juga
    }, 500);
  } catch (error) {
    console.error("[fetchAndUpdateData] Error caught:", error);
    showErrorLoadingData(document.querySelector(`#${tableBodyId}`));
  }
}

function showLoadingSpinner(tableBody) {
  const colSpanCount =
    tableBody.parentElement.querySelector("thead tr").children.length;
  tableBody.innerHTML = `
      <tr>
        <td colspan="${colSpanCount}">
          <div class="flex justify-center items-center py-6">
            <div class="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </td>
      </tr>
    `;
}

function getStatusClass(status) {
  switch (status.toLowerCase()) {
    case "on progress":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-gray-100 text-gray-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
}

function updateState(response) {
  state[currentDataType].totalPages = response.totalPages;
  state[currentDataType].totalRecords = response.totalRecords;
}

function showErrorLoadingData(tableBody) {
  setTimeout(() => {
    tableBody.innerHTML = `<tr><td colspan="${colSpanCount}" style="text-align: center; color: red; font-weight: bold;">Error Loading Data</td></tr>`;
  }, 500);
}

function loadData() {
  const tableBody = document.querySelector("#tableBody");
  if (!tableBody) {
    console.error(`Table body element not found for ${currentDataType}`);
    return;
  }

  tableBody.innerHTML = "";

  console.log("[loadData] dataItems:", dataItems); // ✅ Check what's inside

  if (!dataItems || dataItems.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="${colSpanCount}" style="text-align: center; color: red; font-weight: bold;">No Data Available</td></tr>`;
    return;
  }

  dataItems.forEach((item, index) => {
    const row = document.createElement("tr");

    row.setAttribute("data-index", index);

    const html = window.rowTemplate(item, index);
    const hasDropdown = html.includes("dropdown-menu");
    const action = hasDropdown;

    if (action) {
      row.classList.add(
        "hover:bg-gray-50",
        "cursor-pointer",
        "transition",
        "relative"
      );
      row.onclick = (e) => toggleDropdown(e, row.dataset.index);
    }

    row.innerHTML = html;
    tableBody.appendChild(row);
  });
}

function getTableBody() {
  switch (currentDataType) {
    case "income":
      return document.querySelector("#incomeTableBody");
    case "expense":
      return document.querySelector("#expenseTableBody");
    default:
      return document.querySelector("#tableBody");
  }
}
function updatePagination(paginationContainer, onPageChange) {
  const currentState = state[currentDataType];
  if (!currentState) {
    console.warn("❗ currentDataType belum di-set atau datanya belum tersedia");
    return;
  }
  const { currentPage, totalPages, totalRecords } = currentState;
  paginationContainer.innerHTML = "";

  // Buat wrapper utama yang akan membagi kiri-kanan
  const wrapper = document.createElement("div");
  wrapper.className =
    "w-full flex justify-between items-center flex-wrap gap-2 text-sm text-gray-600";

  // Kiri: info jumlah data
  const info = document.createElement("div");
  info.textContent = `Total Data: ${totalRecords} | Halaman ${currentPage} dari ${totalPages}`;
  wrapper.appendChild(info);

  // Kanan: tombol navigasi
  const nav = document.createElement("div");
  nav.className = "flex flex-wrap gap-1";

  function createButton(text, disabled, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = `px-3 py-1 rounded border text-sm 
      ${
        disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-white hover:bg-blue-100 text-blue-700 border-blue-500"
      }`;
    btn.disabled = disabled;
    if (!disabled && typeof onClick === "function")
      btn.addEventListener("click", onClick);
    return btn;
  }

  nav.appendChild(
    createButton("« First", currentPage === 1, () => onPageChange(1))
  );
  nav.appendChild(
    createButton("‹ Prev", currentPage === 1, () =>
      onPageChange(currentPage - 1)
    )
  );

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === currentPage;
    const btn = createButton(i, false, () => onPageChange(i));
    if (isActive) {
      btn.className += " font-bold bg-blue-500 text-white border-blue-700";
    }
    nav.appendChild(btn);
  }

  nav.appendChild(
    createButton("Next ›", currentPage === totalPages, () =>
      onPageChange(currentPage + 1)
    )
  );
  nav.appendChild(
    createButton("Last »", currentPage === totalPages, () =>
      onPageChange(totalPages)
    )
  );

  wrapper.appendChild(nav);
  paginationContainer.appendChild(wrapper);

  //mobile
  const pageSelect = document.getElementById("pageSelect");
  if (!pageSelect) return;

  // Kosongkan dulu
  pageSelect.innerHTML = "";

  // Tambahkan opsi halaman
  for (let i = 1; i <= totalPages; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Halaman ${i}`;
    if (i === currentPage) option.selected = true;
    pageSelect.appendChild(option);
  }

  // Tambahkan event onChange
  pageSelect.onchange = function () {
    const selectedPage = parseInt(this.value);
    if (!isNaN(selectedPage)) {
      onPageChange(selectedPage); // Fungsi pagination utama
      window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll ke atas
    }
  };

  function onPageChange(page) {
    // Update state halaman saat ini
    if (!state[currentDataType]) {
      state[currentDataType] = {};
    }
    state[currentDataType].currentPage = page;
    fetchAndUpdateData(detail_id);
  }
}

function showFormModal() {
  Swal.fire({
    title: "Create New Data",
    html: formHtml,
    showCancelButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
    preConfirm: () => {
      return getFormData(); // hanya satu fungsi sekarang
    },
  }).then((result) => {
    if (result.isConfirmed) {
      const data = result.value;
      const hasFile = data.file !== undefined;

      if (hasFile) {
        const formData = new FormData();
        for (const key in data) {
          formData.append(key, data[key]);
        }
        handleCreateFile(formData, detail_id);
      } else {
        handleCreate(data, detail_id);
      }

      currentDataSearch = "";
    }
  });
}

function getFormData() {
  const formElement = document.querySelector("#dataform");
  if (!formElement) {
    throw new Error("Form not found");
  }

  const formData = new FormData(formElement);
  const dataObj = {};
  const alwaysString = ["phone", "whatsapp"]; // ← perbaiki logika OR

  for (const [key, value] of formData.entries()) {
    const isArrayField = key.endsWith("[]");
    const cleanKey = isArrayField ? key.slice(0, -2) : key;

    const parsedValue =
      !alwaysString.includes(cleanKey) && !isNaN(value) && value.trim() !== ""
        ? Number(value)
        : value;

    if (isArrayField) {
      if (!dataObj[cleanKey]) {
        dataObj[cleanKey] = [];
      }
      dataObj[cleanKey].push(parsedValue);
    } else {
      dataObj[cleanKey] = parsedValue;
    }
  }

  // Validasi manual jika ada file
  const fileInput = formElement.querySelector("#file");
  if (fileInput && fileInput.files.length > 0) {
    // Kamu bisa validasi file size/type di sini kalau perlu
    dataObj.file = fileInput.files[0];
  }

  if (!validateFormData(dataObj)) {
    return false;
  }

  return dataObj;
}

function handleCreate(data, detail_id) {
  Swal.showLoading();
  const createUrl = endpoints[currentDataType].create;

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const user_id = user?.user_id;
  const owner_id = user?.owner_id;

  const finalData = {
    ...data,
    user_id: user_id,
    owner_id: owner_id,
  };

  const hasFile = data.file instanceof File;

  if (hasFile) {
    const formData = new FormData();

    for (const key in data) {
      if (key === "file" && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else {
        formData.append(key, data[key]);
      }
    }

    // Tambahkan ID yang diperlukan
    formData.append("owner_id", 100);
    formData.append("user_id", 100);

    fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: formData,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => handleCreateResponse(data, detail_id))
      .catch((err) => {
        console.error("Upload error:", err);
        showErrorAlert("Gagal menyimpan data dengan file. Silakan coba lagi.");
      });
  } else {
    fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(finalData),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => handleCreateResponse(data, detail_id))
      .catch((err) => {
        console.error("Create error:", err);
        showErrorAlert("Gagal menyimpan data. Silakan cek isian.");
      });
  }
}

function getFormDataFile() {
  const formElement = document.querySelector("#dataformfile");
  if (!formElement) {
    throw new Error("Form not found");
  }

  const formDataFile = new FormData(formElement);

  if (!validateFormData(formDataFile)) {
    return false;
  }

  return formDataFile;
}

function handleCreateFile(formDataFile, detail_id) {
  Swal.showLoading();
  const createUrl = endpoints[currentDataType].create;

  // Tambah owner_id kalau belum ada
  if (!formDataFile.has("owner_id")) {
    formDataFile.append("owner_id", owner_id);
  }

  const fileInput = document.querySelector('#createForm input[type="file"]');
  if (fileInput && fileInput.files.length > 0) {
    formDataFile.append("file", fileInput.files[0]);
  }

  fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`, // ❌ Tidak pakai Content-Type!
    },
    body: formDataFile,
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          console.error("❌ Respon error:", err);
          throw new Error("Server error: " + (err.message || response.status));
        });
      }
      return response.json();
    })
    .then((data) => handleCreateResponse(data, detail_id))
    .catch((err) => {
      console.error("❌ Error saat upload file:", err);
      showErrorAlert("Gagal menyimpan data. Silakan cek inputan.");
    });
}

function handleCreateResponse(data, detail_id) {
  const message = data.message; // ✅ Ambil dari root, bukan dari data.data.message
  const isSuccess = message === "Data successfully added";

  Swal.fire({
    icon: isSuccess ? "success" : "error",
    title: isSuccess ? "Success" : "Failed",
    text: message,
  }).then(() => {
    fetchAndUpdateData(detail_id);
  });
}

function toggleDropdown(row, event) {
  const dropdown = row.querySelector(".dropdown-menu");

  document.querySelectorAll(".dropdown-menu").forEach((el) => {
    if (el !== dropdown) el.classList.add("hidden");
  });

  const x = event.clientX;
  const y = event.clientY;

  dropdown.style.left = `${x}px`;
  dropdown.style.top = `${y}px`;

  if (dropdown) dropdown.classList.toggle("hidden");
}

document.addEventListener("click", function (e) {
  if (!e.target.closest("tr")) {
    document
      .querySelectorAll(".dropdown-menu")
      .forEach((el) => el.classList.add("hidden"));
  }
});

// ---------------------------------------
// DELETE DATA FUNCTIONS
// ---------------------------------------

function handleDelete(id) {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      const deleteUrl = `${endpoints[currentDataType].delete}/${id}`;
      console.log(deleteUrl);

      fetch(deleteUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => handleDeleteResponse(data))
        .catch(() =>
          showErrorAlert("Failed to delete data. Please try again.")
        );
    }
  });
}

function handleDeleteResponse(data) {
  const message = data.data.message;
  const isSuccess = message === "Data successfully deleted";
  setTimeout(() => {
    Swal.fire({
      icon: isSuccess ? "success" : "error",
      title: isSuccess ? "Deleted" : "Failed",
      text: message,
    }).then(() => {
      fetchAndUpdateData(detail_id);
    });
  }, 500);
}

// ---------------------------------------
// UPDATE DATA FUNCTIONS
// ---------------------------------------

async function handleEdit() {
  const updateUrl = endpoints[currentDataType].detail;
  const fullUrl = `${updateUrl}/${Id}`;

  try {
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    console.log("API URL Get Edit Data:", fullUrl);

    if (!response.ok) {
      throw new Error("Failed to fetch item data");
    }

    const itemData = await response.json();
    console.log(itemData);
    if (!itemData.detail || itemData.detail.length === 0) {
      throw new Error("No item data found for editing");
    }

    const detailItem = itemData.detail;

    Swal.fire({
      title: `Edit ${Data}`,
      html: formHtml,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        Swal.showLoading();

        const fileInput = document.querySelector(
          '#dataformfile input[type="file"]'
        );
        const fileText = document.querySelector("#file_text");

        if (fileInput && fileInput.files.length > 0) {
          return getFormDataFile(); // Handles file upload
        } else if (
          fileText &&
          fileText.value.trim() &&
          fileText.value !== "No image selected"
        ) {
          return getFormDataWithExistingImage(fileText.value.trim()); // Uses existing image
        } else {
          return getFormData(); // Normal form data
        }
      },
      didOpen: async () => {
        await loadDropdownCall(tab);
        fillFormData(detailItem, tab);
        console.log(detailItem);

        //Set the file input label to the existing image name
        const fileInput = document.querySelector(
          '#dataformfile input[type="file"]'
        );
        const fileText = document.querySelector("#file_text");

        if (fileText && fileInput) {
          fileInput.dataset.placeholder = fileText.value; // Custom attribute to indicate the selected image
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.showLoading();
        handleUpdate(Id, result.value);
      }
    });
  } catch (error) {
    console.error("Error while editing:", error);
    showErrorAlert(error.message);
  }
}

function getFormDataWithExistingImage(imagePath) {
  const formData = getFormDataFile();
  formData.append("existing_image", imagePath);
  return formData;
}

function handleUpdate(id, formData) {
  const updateUrl = `${endpoints[currentDataType].update}/${id}`;

  // Check if formData is FormData (file upload) or a regular object
  const isMultipart = formData instanceof FormData;

  if (!isMultipart) {
    formData.owner_id = owner_id;
  } else {
    formData.append("owner_id", owner_id);
  }

  console.log(formData);
  fetch(updateUrl, {
    method: "PUT", // Use POST for form-data, some APIs allow PUT with form-data too
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      ...(isMultipart ? {} : { "Content-Type": "application/json" }), // Do not set Content-Type for FormData
    },
    body: isMultipart ? formData : JSON.stringify(formData),
  })
    .then((response) => response.json())
    .then((data) => handleUpdateResponse(data))
    .catch(() => showErrorAlert("Failed to update data. Please try again."));
}

function handleUpdateResponse(data) {
  const message = data.data.message;
  const isSuccess = message === "Data successfully updated";

  Swal.fire({
    icon: isSuccess ? "success" : "error",
    title: isSuccess ? "Success" : "Failed",
    text: message,
  }).then(() => {
    fetchAndUpdateData(detail_id);
  });
}

const alwaysString = ["phone", "whatsapp"]; // ✅ fixed

function validateFormData(data) {
  for (const key in data) {
    const value = data[key];
    if (Array.isArray(value)) {
      if (value.length === 0 || value.some((v) => v === "" || v === null)) {
        Swal.fire({
          icon: "warning",
          title: "Form Tidak Lengkap",
          text: `Field ${key} harus diisi.`,
        });
        return false;
      }
    }
    if (value === "" || value === null || value === undefined) {
      Swal.fire({
        icon: "warning",
        title: "Form Tidak Lengkap",
        text: `Field ${key} harus diisi.`,
      });
      return false;
    }
  }
  return true;
}
