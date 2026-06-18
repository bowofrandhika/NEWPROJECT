// Utility functions
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatNumber(num: number, decimals = 2): string {
  return num.toFixed(decimals);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Generic statuses
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACTIVE: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',

    // Production statuses
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    ON_HOLD: 'bg-yellow-100 text-yellow-800',
    SKIPPED: 'bg-gray-100 text-gray-800',

    // Issue statuses
    IDENTIFIED: 'bg-orange-100 text-orange-800',
    RESOLVED: 'bg-green-100 text-green-800',
    MONITORING: 'bg-blue-100 text-blue-800',
    REPORTED: 'bg-red-100 text-red-800',
    ACKNOWLEDGED: 'bg-yellow-100 text-yellow-800',
    CLOSED: 'bg-gray-100 text-gray-800',

    // Pallet statuses
    PACKED: 'bg-blue-100 text-blue-800',
    STAGED: 'bg-yellow-100 text-yellow-800',
    SHIPPED: 'bg-green-100 text-green-800',
    RELEASED: 'bg-green-100 text-green-800',

    // Downtime
    PLANNED: 'bg-gray-100 text-gray-800',
    OVERDUE: 'bg-red-100 text-red-800',

    // Severity
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',

    // Quality
    PASSED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    CONDITIONAL: 'bg-yellow-100 text-yellow-800',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    VERIFIED: 'bg-green-100 text-green-800',
    OPEN: 'bg-yellow-100 text-yellow-800',
    IMPLEMENTED: 'bg-blue-100 text-blue-800'
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
