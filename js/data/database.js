// Data storage
const people = [
    { id: 1, name: "Alice Johnson", role: "Developer" },
    { id: 2, name: "Bob Smith", role: "Designer" },
    { id: 3, name: "Carol White", role: "Developer" },
    { id: 4, name: "David Brown", role: "Manager" },
    { id: 5, name: "Eve Davis", role: "Developer" }
];

const projects = [
    { id: 1, name: "Website Redesign", startDate: "2024-01", endDate: "2024-06" },
    { id: 2, name: "Mobile App", startDate: "2024-03", endDate: "2024-12" },
    { id: 3, name: "API Development", startDate: "2024-02", endDate: "2024-08" },
    { id: 4, name: "Database Migration", startDate: "2024-05", endDate: "2024-09" }
];

const allocations = [
    { personId: 1, projectId: 1, month: "2024-01", percentage: 50 },
    { personId: 1, projectId: 3, month: "2024-01", percentage: 30 },
    { personId: 2, projectId: 1, month: "2024-01", percentage: 100 },
    { personId: 3, projectId: 3, month: "2024-02", percentage: 80 },
    { personId: 1, projectId: 1, month: "2024-02", percentage: 60 },
    { personId: 2, projectId: 1, month: "2024-02", percentage: 100 },
    { personId: 4, projectId: 2, month: "2024-03", percentage: 40 },
    { personId: 5, projectId: 2, month: "2024-03", percentage: 100 },
    { personId: 1, projectId: 2, month: "2024-03", percentage: 70 },
    { personId: 3, projectId: 4, month: "2024-05", percentage: 100 },
    { personId: 5, projectId: 4, month: "2024-05", percentage: 50 }
];

// Data access functions
export function getPeople() {
    return people;
}

export function getProjects() {
    return projects;
}

export function getAllocations() {
    return allocations;
}

export function getPersonById(id) {
    return people.find(p => p.id === id);
}

export function getProjectById(id) {
    return projects.find(p => p.id === id);
}

export function getAllocationsByMonth(month) {
    return allocations.filter(a => a.month === month);
}

export function getAllocationsByPerson(personId) {
    return allocations.filter(a => a.personId === personId);
}

export function getAllocationsByProject(projectId) {
    return allocations.filter(a => a.projectId === projectId);
}
