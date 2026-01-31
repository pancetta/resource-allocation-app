// Helper to apply correct/warning classes
export function cellClass(actual, expected) {
    if (actual === expected) return 'correct';
    return 'warning';
}
