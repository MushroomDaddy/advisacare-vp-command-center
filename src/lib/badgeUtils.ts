export function getUrgencyBadgeColor(urgency: string): string {
  switch (urgency) {
    case 'Immediate': return 'bg-red-100 text-red-800';
    case 'Urgent 24-48 hours': return 'bg-orange-100 text-orange-800';
    case 'Routine': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getStageBadgeColor(stage: string): string {
  switch (stage) {
    case 'New': return 'bg-blue-100 text-blue-800';
    case 'Missing Docs': return 'bg-red-100 text-red-800';
    case 'Eligibility': return 'bg-yellow-100 text-yellow-800';
    case 'Staffing': return 'bg-purple-100 text-purple-800';
    case 'Scheduled': return 'bg-indigo-100 text-indigo-800';
    case 'Started': return 'bg-green-100 text-green-800';
    case 'Declined': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getPriorityBadgeColor(priority: string): string {
  switch (priority) {
    case 'High': return 'bg-red-100 text-red-800';
    case 'Medium': return 'bg-yellow-100 text-yellow-800';
    case 'Low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'Open':
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    case 'In Progress': return 'bg-blue-100 text-blue-800';
    case 'Complete':
    case 'Completed': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
