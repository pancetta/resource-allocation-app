// Tab management with localStorage persistence
export function initTabs() {
    // Guard against non-DOM environments
    if (typeof document === 'undefined') {
        return;
    }
    
    const tabButtons = document.querySelectorAll(".tab-button");
    if (tabButtons.length === 0) {
        return; // No tab buttons found, skip initialization
    }
    
    tabButtons.forEach(btn => {
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
        const firstButton = document.querySelector(".tab-button");
        const firstContent = document.querySelector(".tab-content");
        if (firstButton) firstButton.classList.add("active");
        if (firstContent) firstContent.classList.add("active");
    }
}
