/**************************************
  CONFIG
**************************************/

const BACKEND_BASE = "http://localhost:5001";

/**************************************
  LOGIN STORAGE
**************************************/
function saveUser(email) {
  localStorage.setItem("userEmail", email);
}

function getUser() {
  return localStorage.getItem("userEmail");
}

if (q("logoutBottom")) {
  q("logoutBottom").onclick = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInName");
    window.location.href = "index.html";
  };
}

/**************************************
  LOGIN PAGE
**************************************/

if (q("loginForm")) {
  // Already logged in → go home
  if (getUser()) {
    window.location.href = "home.html";
  }

  q("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const email = q("email").value.trim();
    const password = q("password").value.trim();

    if (!email || !password) {
      alert("Enter email & password");
      return;
    }

    saveUser(email); // store user email
    window.location.href = "home.html";
  });
}

/**************************************
  CONFIG
**************************************/
// const BACKEND_BASE = "http://localhost:5001";
let USER_ID = localStorage.getItem("userEmail"); // used for backend identification

/**************************************
  UTILS
**************************************/
function q(id) {
  return document.getElementById(id);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );
}

function formatMoney(n) {
  return "₹" + (Number(n) || 0);
}

/**************************************
  HOME PAGE (Add Trip)
**************************************/
if (q("tripForm")) {
  // NAVIGATION BUTTONS
  q("goDashboard").onclick = () => (window.location.href = "dashboard.html");
  q("goSaved").onclick = () => (window.location.href = "saved.html");

  // ADD TRIP
  q("tripForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();

    const destination = q("destination").value.trim();
    const startDate = q("startDate").value;
    const endDate = q("endDate").value;
    const budget = q("budget").value;
    const notes = q("notes").value.trim();

    if (!destination || !startDate || !endDate || !budget) {
      alert("Please fill all required fields.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      alert("End date must be after start date.");
      return;
    }

    try {
      const data = {
        userEmail: USER_ID,
        destination,
        startDate,
        endDate,
        budget: Number(budget),
        notes,
      };

      const res = await fetch(`${BACKEND_BASE}/addTrip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Backend error");

      alert("Trip added successfully!");
      q("tripForm").reset();
    } catch (err) {
      console.error(err);
      alert("Failed to add trip.");
    }
  });
}

/**************************************
  SAVED TRIPS PAGE
**************************************/
if (q("tripList")) {
  const list = q("tripList");
  const filterYear = q("filterYear");
  const filterMonth = q("filterMonth");

  q("homeBtn").onclick = () => (window.location.href = "home.html");

  // LOAD TRIPS
  async function loadTrips() {
    list.innerHTML = "<p>Loading...</p>";

    try {
      const res = await fetch(`${BACKEND_BASE}/trips/${USER_ID}`);
      const trips = await res.json();
      populateYears(trips);
      renderTrips(trips);
    } catch (err) {
      console.error(err);
      list.innerHTML = "<p style='color:red'>Error loading trips.</p>";
    }
  }

  // Populate years
  function populateYears(trips) {
    const years = [
      ...new Set(trips.map((t) => new Date(t.startDate).getFullYear())),
    ];
    filterYear.innerHTML = `<option value="">All</option>`;
    years.sort().forEach((y) => {
      filterYear.innerHTML += `<option value="${y}">${y}</option>`;
    });
  }

  // Render trips filtered
  function renderTrips(trips) {
    const y = filterYear.value;
    const m = filterMonth.value;

    const filtered = trips.filter((t) => {
      const d = new Date(t.startDate);
      if (y && d.getFullYear() != y) return false;
      if (m && d.getMonth() + 1 != m) return false;
      return true;
    });

    if (!filtered.length) {
      list.innerHTML = "<p>No trips match the filter.</p>";
      return;
    }

    list.innerHTML = "";
    filtered.forEach((t) => {
      const div = document.createElement("div");
      div.className = "trip-card";
      div.innerHTML = `
        <h4>${escapeHtml(t.destination)}</h4>
        <p><strong>From:</strong> ${t.startDate}</p>
        <p><strong>To:</strong> ${t.endDate}</p>
        <p><strong>Budget:</strong> ${formatMoney(t.budget)}</p>
        <p><strong>Notes:</strong> ${escapeHtml(t.notes || "—")}</p>

        <div style="margin-top:10px; display:flex; gap:8px;">
          <button class="btn small-btn" data-id="${
            t._id
          }" data-action="edit">Edit</button>
          <button class="btn small-btn red" data-id="${
            t._id
          }" data-action="delete">Delete</button>
        </div>
      `;
      list.appendChild(div);
    });
  }

  // Actions (EDIT / DELETE)
  list.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === "delete") {
      await fetch(`${BACKEND_BASE}/deleteTrip/${id}`, { method: "DELETE" });
      loadTrips();
    }

    if (action === "edit") {
      const destination = prompt("Destination:");
      const startDate = prompt("Start Date (YYYY-MM-DD):");
      const endDate = prompt("End Date (YYYY-MM-DD):");
      const budget = prompt("Budget:");

      if (!destination || !startDate || !endDate || !budget) return;

      await fetch(`${BACKEND_BASE}/updateTrip/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, startDate, endDate, budget }),
      });

      loadTrips();
    }
  });

  // Filters
  q("applyFilter").onclick = loadTrips;
  q("clearFilter").onclick = () => {
    filterYear.value = "";
    filterMonth.value = "";
    loadTrips();
  };

  loadTrips();
}

/**************************************
  DASHBOARD PAGE
**************************************/
if (q("statTotalTrips")) {
  q("homeFromDash").onclick = () => (window.location.href = "home.html");

  async function getTrips() {
    try {
      const res = await fetch(`${BACKEND_BASE}/trips/${USER_ID}`);
      return await res.json();
    } catch {
      return [];
    }
  }

  async function renderDashboard() {
    const trips = await getTrips();

    // Stats
    q("statTotalTrips").textContent = trips.length;
    q("statTotalBudget").textContent = formatMoney(
      trips.reduce((s, t) => s + (Number(t.budget) || 0), 0)
    );

    const upcoming = trips
      .filter((t) => new Date(t.startDate) >= new Date())
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];

    q("statUpcoming").textContent = upcoming ? upcoming.destination : "None";

    const highest = trips.sort((a, b) => b.budget - a.budget)[0];
    q("statHighest").textContent = highest
      ? `${formatMoney(highest.budget)} (${highest.destination})`
      : "₹0";

    // CHART: Trips per month
    const months = Array(12).fill(0);
    const thisYear = new Date().getFullYear();

    trips.forEach((t) => {
      const d = new Date(t.startDate);
      if (d.getFullYear() === thisYear) {
        months[d.getMonth()]++;
      }
    });

    const ctx1 = q("chartTripsMonth").getContext("2d");
    new Chart(ctx1, {
      type: "bar",
      data: {
        labels: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        datasets: [
          { label: "Trips", data: months, backgroundColor: "#0078ff" },
        ],
      },
    });

    // CHART: Budget Breakdown
    const ctx2 = q("chartBudgetBreakdown").getContext("2d");
    new Chart(ctx2, {
      type: "pie",
      data: {
        labels: trips.map((t) => t.destination),
        datasets: [{ data: trips.map((t) => t.budget) }],
      },
    });
  }

  renderDashboard();
}
