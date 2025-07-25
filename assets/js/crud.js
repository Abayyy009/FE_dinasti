let dataItems = [];
let colSpanCount = null;
let currentDataType = null;
let debounceTimeout;
let accountOptions = [];
let itemCounter = 0;
let daftarKlien = [];
let customerList = [];
let produkList = [];
let regionList = [];
let state = {};
let currentDataSearch = "";

function setDataType(type) {
  currentDataType = type;
  if (!state[type]) {
    state[type] = { currentPage: 1, totalPages: 1, totalRecords: 0 };
  }
}

function debounceSearch() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    searchData();
  }, 300);
}

function getFormData(formType = "create") {
  const form = document.querySelector(`#${formType}Form`);
  const inputs = form.querySelectorAll("input, select, textarea");
  const data = {};
  inputs.forEach((input) => {
    if (!input.name) return;
    if (input.type === "file") return; // file ditangani terpisah
    if (input.name === "phone") {
      const phone = input.value.trim();
      data[input.name] = phone.startsWith("62") ? phone : `62${phone}`;
    } else {
      data[input.name] = input.value;
    }
  });
  return data;
}

function validateFormData(formData, formType) {
  // Sesuaikan validasi untuk tiap tipe data
  if (currentDataType === "admin" || currentDataType === "detailcampaign") {
    if (!formData.nama_sales || formData.nama_sales.trim() === "") {
      showErrorDialog("Nama sales wajib diisi.");
      return false;
    }
  }
  // Tambahkan validasi lain jika perlu
  return true;
}

async function handleCreate() {
  const formDataObject = getFormData("create");
  if (!validateFormData(formDataObject, "create")) return;

  const formData = new FormData();
  for (const key in formDataObject) {
    formData.append(key, formDataObject[key]);
  }

  const fileInput = document.querySelector('#createForm input[type="file"]');
  if (fileInput && fileInput.files.length > 0) {
    formData.append("file", fileInput.files[0]);
  }

  try {
    const response = await createData(currentDataType, formData);
    if (response) {
      showSuccessDialog("Data berhasil ditambahkan.");
      fetchAndUpdateData(); // Refresh data
      closeFormModal();
    }
  } catch (error) {
    showErrorDialog("Gagal menambahkan data.");
    console.error("Error handleCreate:", error);
  }
}

async function handleEdit() {
  const id = getEditId();
  const formDataObject = getFormData("edit");
  if (!validateFormData(formDataObject, "edit")) return;

  const formData = new FormData();
  for (const key in formDataObject) {
    formData.append(key, formDataObject[key]);
  }

  const fileInput = document.querySelector('#editForm input[type="file"]');
  if (fileInput && fileInput.files.length > 0) {
    formData.append("file", fileInput.files[0]);
  }

  try {
    const response = await updateData(currentDataType, id, formData);
    if (response) {
      showSuccessDialog("Data berhasil diubah.");
      fetchAndUpdateData();
      closeFormModal();
    }
  } catch (error) {
    showErrorDialog("Gagal mengubah data.");
    console.error("Error handleEdit:", error);
  }
}

function getEditId() {
  switch (currentDataType) {
    case "admin":
      return document.getElementById("cs_id").value;
    case "campaign":
      return document.getElementById("campaign_id").value;
    case "tool":
      return document.getElementById("tool_id").value;
    case "detailcampaign":
      return document.getElementById("detail_id").value;
    default:
      return null;
  }
}

async function fetchAndUpdateData(id = null) {
  try {
    const response = await fetchData(
      currentDataType,
      state[currentDataType].currentPage,
      id
    );
    if (!response || !response.tableData) return;

    dataItems = response.tableData;
    renderTable(dataItems);

    state[currentDataType].totalPages = response.totalPages || 1;
    state[currentDataType].totalRecords = response.totalRecords || 0;

    updatePagination(
      state[currentDataType].currentPage,
      state[currentDataType].totalPages
    );
  } catch (error) {
    console.error("fetchAndUpdateData error:", error);
  }
}

function searchData() {
  state[currentDataType].currentPage = 1;
  fetchAndUpdateData();
}
