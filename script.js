const body = document.body;
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const themeToggle = document.querySelector("#theme-toggle");
const themeName = "roam-rent-theme";

function setTheme(theme) {
  const isDark = theme === "dark";
  body.dataset.theme = isDark ? "dark" : "light";
  themeToggle?.setAttribute("aria-pressed", String(isDark));
  try { localStorage.setItem(themeName, theme); } catch {}
}

let savedTheme = "light";
try { savedTheme = localStorage.getItem(themeName) || "light"; } catch {}
setTheme(savedTheme === "dark" ? "dark" : "light");

themeToggle?.addEventListener("click", () => {
  setTheme(body.dataset.theme === "dark" ? "light" : "dark");
});

function setMenu(open) {
  body.classList.toggle("menu-open", open);
  menuToggle?.setAttribute("aria-expanded", String(open));
}

menuToggle?.addEventListener("click", () => {
  setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});
navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});
document.addEventListener("click", (event) => {
  if (body.classList.contains("menu-open")
      && !navigation?.contains(event.target)
      && !menuToggle?.contains(event.target)) setMenu(false);
});

const filterButtons = document.querySelectorAll("[data-filter]");
const productCards = document.querySelectorAll(".product-card");

function selectFilter(filter) {
  filterButtons.forEach((button) => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  productCards.forEach((card) => {
    card.closest("li").hidden = filter !== "all" && card.dataset.category !== filter;
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => selectFilter(button.dataset.filter));
});
document.querySelectorAll("[data-filter-link]").forEach((link) => {
  link.addEventListener("click", () => selectFilter(link.dataset.filterLink));
});

const form = document.querySelector("#rental-form");
const issueDate = document.querySelector("#issue-date");
const returnDate = document.querySelector("#return-date");
const gearChoices = [...document.querySelectorAll(".gear-choice")];
const totalPrice = document.querySelector("#total-price");
const summaryCopy = document.querySelector("#summary-copy");
const formMessage = document.querySelector("#form-message");

function dayIndex(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function rentalDays() {
  const start = dayIndex(issueDate.value);
  const end = dayIndex(returnDate.value);
  if (start === null || end === null || end < start) return 0;
  return Math.max(1, end - start);
}

function selectedItems() {
  return gearChoices.filter((choice) => choice.checked);
}

function updateEstimate() {
  const days = rentalDays();
  const chosen = selectedItems();
  const itemSubtotal = chosen.reduce((sum, choice) => sum + Number(choice.dataset.price), 0);
  const total = days > 0 ? days * itemSubtotal : 0;
  totalPrice.textContent = "₸" + new Intl.NumberFormat("en-US").format(total);
  if (!chosen.length) {
    summaryCopy.textContent = "Choose equipment and dates to see your total. Pricing is per item, per day.";
  } else if (!days) {
    summaryCopy.textContent = chosen.length + " item" + (chosen.length === 1 ? "" : "s") + " selected. Choose dates to see your total.";
  } else {
    summaryCopy.textContent = chosen.length + " item" + (chosen.length === 1 ? "" : "s") + " · " + days + " rental day" + (days === 1 ? "" : "s") + ".";
  }
}

function validateRentalDates() {
  const invalidRange = issueDate.value && returnDate.value
    && dayIndex(returnDate.value) < dayIndex(issueDate.value);
  returnDate.setCustomValidity(invalidRange ? "Return date must be the same as or later than the issue date." : "");
  return !invalidRange;
}

issueDate.addEventListener("change", () => {
  returnDate.min = issueDate.value;
  validateRentalDates();
  updateEstimate();
});
returnDate.addEventListener("change", () => {
  validateRentalDates();
  updateEstimate();
});
gearChoices.forEach((choice) => choice.addEventListener("change", updateEstimate));

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.removeAttribute("data-state");
  formMessage.textContent = "";
  if (!validateRentalDates() || !form.reportValidity()) return;
  if (!selectedItems().length) {
    formMessage.dataset.state = "error";
    formMessage.textContent = "Select at least one item to calculate your rental.";
    document.querySelector(".inventory").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  updateEstimate();
  const days = rentalDays();
  formMessage.textContent = "Estimate ready for " + days + " day" + (days === 1 ? "" : "s") + ". This demo does not submit a reservation.";
});

updateEstimate();
