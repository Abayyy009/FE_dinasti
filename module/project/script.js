pagemodule = "project";
colSpanCount = 9;
setDataType("project");
fetchAndUpdateData();

document.getElementById("addButton").addEventListener("click", () => {
  showFormModal();
  loadDropdownCall();
});

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">
    <td class="px-6 py-4 text-sm border-b sm:border-0 flex justify-between sm:table-cell bg-gray-800 text-white sm:bg-transparent sm:text-gray-700">
      <span class="font-medium sm:hidden">Project Number</span>  
      ${item.project_number}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Description</span>  
      ${item.project_name}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Type</span>  
      ${item.type}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Customer</span>  
      ${item.customer}
    </td>

    <td class="px-6 py-4 text-sm text-right text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Project Value</span>  
      Rp ${item.project_value}
    </td>

    <td class="px-6 py-4 text-sm text-right text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Plan Costing (%)</span>  
      ${item.plan_costing_percent}%
    </td>

    <td class="px-6 py-4 text-sm text-right text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Actual Cost (%)</span>  
      ${item.actual_cost_percent}%
    </td>

    <td class="px-6 py-4 text-sm text-right text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Margin (%)</span>  
      ${item.margin_percent}%
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Status</span>
      ${item.status}
    </td>
  </tr>`;
};

formHtml = `
<form id="dataform" class="space-y-4 text-center">

  <div>
    <select id="projectManager" name="project_manager_id"
      class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700">
      <option value="">Pilih Project Manager</option>
      <option value="100">Manager 1</option>
      <option value="101">Manager 2</option>
      <!-- Tambah data dari API jika diperlukan -->
    </select>
  </div>

  <div>
    <select id="description" name="description"
      class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700">
      <option value="">Pilih Deskripsi</option>
      <option value="SAMPLE1">SAMPLE1</option>
      <option value="SAMPLE2">SAMPLE2</option>
      <option value="SAMPLE3">SAMPLE3</option>
      <!-- Bisa diisi dinamis juga -->
    </select>
  </div>

  <div>
    <input id="contractValue" name="contract_value" type="number" placeholder="Nilai Kontrak (Rp)"
      class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
  </div>

  <div>
    <input id="planCosting" name="plan_costing" type="number" placeholder="Perkiraan Biaya (Rp)"
      class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label for="startDate" class="block text-left text-sm font-medium text-gray-700">
        Start Date <span class="text-red-500">*</span>
      </label>
      <input id="startDate" name="start_date" type="date"
        class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
    </div>

    <div>
      <label for="finishDate" class="block text-left text-sm font-medium text-gray-700">
        Finish Date <span class="text-red-500">*</span>
      </label>
      <input id="finishDate" name="finish_date" type="date"
        class="form-control w-full px-3 py-2 border rounded-md bg-white text-gray-700" />
    </div>
  </div>
</form>
`;
