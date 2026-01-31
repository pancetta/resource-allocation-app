// Utility function for determining cell CSS class based on allocation percentage
export function cellClass(percentage) {
    if (percentage < 80) return 'underallocated';
    if (percentage === 100) return 'fullyallocated';
    return 'overallocated';
}
