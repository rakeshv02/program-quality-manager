export function getStatusBadge(status: string) {
  if (status === 'valid' || status === 'no_expiry') {
    return { label: 'Compliant', classes: 'bg-green-100 text-green-800 border-green-200' };
  }
  if (status === 'expiring') {
    return { label: 'Expiring Soon', classes: 'bg-amber-100 text-amber-800 border-amber-200' };
  }
  if (status === 'expired') {
    return { label: 'Expired', classes: 'bg-red-100 text-red-800 border-red-200' };
  }
  if (status === 'active') {
    return { label: 'Active', classes: 'bg-green-100 text-green-800 border-green-200' };
  }
  if (status === 'inactive') {
    return { label: 'Inactive', classes: 'bg-gray-100 text-gray-800 border-gray-200' };
  }
  
  return { label: status, classes: 'bg-gray-100 text-gray-800 border-gray-200' };
}
