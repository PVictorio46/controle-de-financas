const tbody = document.querySelector("tbody");
const desc = document.querySelector("#desc");
const amount = document.querySelector("#amount");
const type = document.querySelector("#type");

const incomes = document.querySelector("#incomes");
const expenses = document.querySelector("#expenses");
const total = document.querySelector("#total");

const monthSelect = document.querySelector("#monthSelect");
const reportTitle = document.querySelector("#reportTitle");

const months = [
"Janeiro","Fevereiro","Março","Abril","Maio","Junho",
"Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

months.forEach(m => monthSelect.innerHTML += `<option>${m}</option>`);

const currentMonthIndex = new Date().getMonth();
monthSelect.selectedIndex = currentMonthIndex;

let currentMonth = monthSelect.value;
let items = [];

monthSelect.addEventListener("change", () => {
currentMonth = monthSelect.value;
loadItens();
});

amount.addEventListener("input", () => {
let value = amount.value.replace(/\D/g,"");
value = (value/100).toLocaleString("pt-BR",{minimumFractionDigits:2});
amount.value = value;
});

document.querySelector("#btnNew").onclick = () => {

if(desc.value === "" || amount.value === "") return alert("Preencha os campos");

const numericValue = Number(amount.value.replace(/\./g,"").replace(",","."));

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

function loadItens(){
items = getItensBD();
tbody.innerHTML = "";

items.forEach((item,index)=>insertItem(item,index));

getTotals();

reportTitle.innerText = `Relatório Financeiro - ${currentMonth}`;
}

function insertItem(item,index){
let tr = document.createElement("tr");

tr.innerHTML = `
<td>${item.desc}</td>
<td>${formatCurrency(item.amount)}</td>
<td>${item.type === "Entrada"
? '<i class="bx bxs-chevron-up-circle" style="color:#00e676"></i>'
: '<i class="bx bxs-chevron-down-circle" style="color:#ff5252"></i>'}
</td>
<td><i class='bx bx-trash' onclick="deleteItem(${index})"></i></td>
`;

tbody.appendChild(tr);
}

function deleteItem(index){
items.splice(index,1);
setItensBD();
loadItens();
}

function getTotals(){

const totalIncomes = items
.filter(i => i.type === "Entrada")
.reduce((acc,i)=>acc+i.amount,0);

const totalExpenses = items
.filter(i => i.type === "Saída")
.reduce((acc,i)=>acc+i.amount,0);

incomes.textContent = formatCurrency(totalIncomes);
expenses.textContent = formatCurrency(totalExpenses);
total.textContent = formatCurrency(totalIncomes - totalExpenses);
}

function formatCurrency(value){
return value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

function getItensBD(){
return JSON.parse(localStorage.getItem("financas_"+currentMonth)) ?? [];
}

function setItensBD(){
localStorage.setItem("financas_"+currentMonth, JSON.stringify(items));
}

function printReport(){
window.print();
}

loadItens();
