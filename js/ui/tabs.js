// Tab management with localStorage persistence
export function initTabs() {
    document.querySelectorAll(".tab-button").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(btn.dataset.tab).classList.add("active");
            localStorage.setItem("lastActiveTab", btn.dataset.tab);
        });
    });
    
    // Restore last active tab
    const lastTab = localStorage.getItem("lastActiveTab") || "people";
    const btn = document.querySelector(`.tab-button[data-tab="${lastTab}"]`);
    const tabDiv = document.getElementById(lastTab);
    
    if (btn && tabDiv) {
        btn.classList.add("active");
        tabDiv.classList.add("active");
    } else {
        document.querySelector(".tab-button").classList.add("active");
        document.querySelector(".tab-content").classList.add("active");
    }
}
