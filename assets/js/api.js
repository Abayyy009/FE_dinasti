const mode = "development"; // development | production
const baseUrl =
  mode === "development"
    ? "https://devdinasti.katib.cloud"
    : "https://devdinasti.katib.cloud";
const API_TOKEN =
  "e29c2e3db5f5299dc954eae580893689c35ecde79f40213365f56fb54850f9b1";
let url = null;
let currentDataSearch = "";
let currentPeriod = "weekly"; // default
let chartType = "bar"; // default (bisa bar atau line)
let STATUS_CACHE = null;
let OLD_STATUS_LABEL = null;
let OLD_STATUS_REV = null;

const defaultState = {
  currentPage: 1,
  totalPages: 1,
  totalRecords: 0,
  isSubmitting: false,
};

function modedev() {
  const devModeElement = document.getElementById("devmode");
  if (mode === "development") {
    devModeElement.classList.remove("hidden");
    devModeElement.textContent = "";
  }
}

const state = {
  user: { ...defaultState },
  sales: { ...defaultState },
  project: { ...defaultState },
  sales_detail: { ...defaultState },
};

const endpoints = ["user", "sales", "project", "sales_detail"].reduce(
  (acc, type) => {
    acc[type] = {
      table: `${baseUrl}/table/${type}/100`,
      list: `${baseUrl}/list/${type}/${owner_id}`,
      detail: `${baseUrl}/detail/${type}`,
      update: `${baseUrl}/update/${type}`,
      create: `${baseUrl}/add/${type}`,
      delete: `${baseUrl}/delete/${type}`,
    };
    return acc;
  },
  {}
);

async function fetchData(type, page = 1, id = null) {
  try {
    let url = id
      ? `${endpoints[type].table}/${id}/${page}`
      : `${endpoints[type].table}/${page}`;

    if (currentDataSearch && currentDataSearch.trim() !== "") {
      url += `?search=${encodeURIComponent(currentDataSearch.trim())}`;
    }

    console.log("[fetchData] Final URL:", url); // ✅ Debug URL

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    if (!response.ok) throw new Error("Network response was not ok");

    const json = await response.json();
    console.log("[fetchData] Response JSON:", json); // ✅ Debug JSON response

    // Kondisi: respons bisa dari sales (pakai json.data.records) atau project (pakai json.tableData)
    const isProject = Array.isArray(json.tableData);

    return {
      tableData: isProject ? json.tableData : json?.data?.records || [],
      totalRecords: isProject
        ? json.totalRecords
        : json?.data?.totalRecords || json?.data?.records?.length || 0,
      totalPages: isProject ? json.totalPages : json?.data?.totalPages || 1,
      currentPage: isProject ? json.currentPage : json?.data?.currentPage || 1,
    };
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    return { tableData: [], totalRecords: 0, totalPages: 0, currentPage: 1 };
  }
}

async function fetchList(type) {
  try {
    const url = `${endpoints[type].list}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    if (!response.ok)
      throw new Error(`Failed to fetch ${type} data: ${response.statusText}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error fetching ${type} list:`, error);
    return [];
  }
}

async function fetchById(type, id) {
  try {
    const response = await fetch(`${endpoints[type].detail}/${id}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${type} by ID:`, error);
    return null;
  }
}

async function updateData(type, id, payload) {
  try {
    const response = await fetch(`${endpoints[type].update}/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error(`Error updating ${type} data:`, error);
    return null;
  }
}

async function createData(type, payload) {
  try {
    const body = JSON.stringify({ owner_id, ...payload });
    const response = await fetch(`${endpoints[type].create}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: body,
    });

    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error(`Error creating ${type}:`, error);
    return null;
  }
}

async function createDataWithFile(type, payload) {
  try {
    const formDataFile = new FormData();

    // Append all payload fields to FormData
    for (const key in payload) {
      formDataFile.append(key, payload[key]);
    }

    // Append owner_id separately if needed
    if (owner_id) {
      formDataFile.append("owner_id", owner_id);
    }

    const response = await fetch(`${endpoints[type].create}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        // **DO NOT** manually set `Content-Type`, the browser will handle it automatically
      },
      body: formDataFile,
    });

    if (!response.ok) throw new Error("Network response was not ok");

    return await response.json();
  } catch (error) {
    console.error(`Error creating ${type}:`, error);
    return null;
  }
}

async function deleteData(type, id) {
  try {
    const response = await fetch(`${endpoints[type].delete}/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error(`Error deleting ${type}:`, error);
    return null;
  }
}
