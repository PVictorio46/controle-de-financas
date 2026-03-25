const tbody = document.querySelector("tbody");
const desc = document.querySelector("#desc");
const amount = document.querySelector("#amount");
const type = document.querySelector("#type");

const incomes = document.querySelector("#incomes");
const expenses = document.querySelector("#expenses");
const total = document.querySelector("#total");

const monthSelect = document.querySelector("#monthSelect");
const reportTitle = document.querySelector("#reportTitle");


const defaultMonths = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

let currentMonth = "";
let items = [];

function getCustomMonths() {
  return JSON.parse(localStorage.getItem("customMonths")) ?? [];
}

function setCustomMonths(list) {
  localStorage.setItem("customMonths", JSON.stringify(list));
}

function loadMonthSelect() {
  const customMonths = getCustomMonths();

  monthSelect.innerHTML = "";

  
  defaultMonths.forEach(m => {
    monthSelect.innerHTML += `<option value="${m}">${m}</option>`;
  });

  
  if (customMonths.length > 0) {
    monthSelect.innerHTML += `<option disabled>──────────</option>`;
  }

  
  customMonths.forEach(m => {
    monthSelect.innerHTML += `<option value="${m}">${m}</option>`;
  });

  
  monthSelect.innerHTML += `<option value="__create__">➕ Criar Outro</option>`;
  monthSelect.innerHTML += `<option value="__delete__">❌ Excluir atual</option>`;

 
  const currentMonthIndex = new Date().getMonth();
  monthSelect.selectedIndex = currentMonthIndex;

  currentMonth = monthSelect.value;
}


monthSelect.addEventListener("change", () => {

  if (monthSelect.value === "__create__") {

    const name = prompt("Nome da nova aba:");

    if (!name) {
      loadMonthSelect();
      return;
    }

    let customMonths = getCustomMonths();

    if (customMonths.includes(name) || defaultMonths.includes(name)) {
      alert("Esse nome já existe!");
      loadMonthSelect();
      return;
    }

    customMonths.push(name);
    setCustomMonths(customMonths);

    loadMonthSelect();
    monthSelect.value = name;

    currentMonth = name;
    loadItens();
    return;
  }


  if (monthSelect.value === "__delete__") {

    if (defaultMonths.includes(currentMonth)) {
      alert("Não pode excluir meses padrão!");
      loadMonthSelect();
      return;
    }

    const confirmDelete = confirm(`Excluir "${currentMonth}"?`);

    if (!confirmDelete) {
      loadMonthSelect();
      return;
    }

    let customMonths = getCustomMonths();

    customMonths = customMonths.filter(m => m !== currentMonth);
    setCustomMonths(customMonths);

    localStorage.removeItem(`financas_${currentMonth}`);

    loadMonthSelect();
    loadItens();
    return;
  }

 
  currentMonth = monthSelect.value;
  loadItens();
});


amount.addEventListener("input", () => {
  let value = amount.value.replace(/\D/g, "");
  value = (value / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2
  });
  amount.value = value;
});


document.querySelector("#btnNew").onclick = () => {
  if (desc.value === "" || amount.value === "") {
    alert("Preencha os campos");
    return;
  }

  const numericValue = Number(
    amount.value.replace(/\./g, "").replace(",", ".")
  );

  items.push({
    desc: desc.value,
    amount: numericValue,
    type: type.value
  });

  setItensBD();
  loadItens();

  desc.value = "";
  amount.value = "";
};


function getKey() {
  return `financas_${currentMonth}`;
}

function getItensBD() {
  return JSON.parse(localStorage.getItem(getKey())) ?? [];
}

function setItensBD() {
  localStorage.setItem(getKey(), JSON.stringify(items));
}


function loadItens() {
  items = getItensBD();
  tbody.innerHTML = "";

  items.forEach((item, index) => {
    insertItem(item, index);
  });

  getTotals();

  reportTitle.innerText = `Relatório - ${currentMonth}`;
}

function insertItem(item, index) {
  let tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${item.desc}</td>
    <td>${formatCurrency(item.amount)}</td>
    <td>${
      item.type === "Entrada"
        ? '<i class="bx bxs-chevron-up-circle" style="color:#00e676"></i>'
        : '<i class="bx bxs-chevron-down-circle" style="color:#ff5252"></i>'
    }</td>
    <td>
      <i class="bx bx-trash" onclick="deleteItem(${index})"></i>
    </td>
  `;

  tbody.appendChild(tr);
}


function deleteItem(index) {
  items.splice(index, 1);
  setItensBD();
  loadItens();
}


function getTotals() {
  const totalIncomes = items
    .filter(i => i.type === "Entrada")
    .reduce((acc, i) => acc + i.amount, 0);

  const totalExpenses = items
    .filter(i => i.type === "Saída")
    .reduce((acc, i) => acc + i.amount, 0);

  incomes.textContent = formatCurrency(totalIncomes);
  expenses.textContent = formatCurrency(totalExpenses);
  total.textContent = formatCurrency(totalIncomes - totalExpenses);
}

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}


function printReport() {
  window.print();
}

loadMonthSelect();
loadItens();