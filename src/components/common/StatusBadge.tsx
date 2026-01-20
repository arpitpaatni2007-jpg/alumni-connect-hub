import { ConnectionStatus, MentorshipStatus } from '@/types/database';

interface StatusBadgeProps {
  status: ConnectionStatus | MentorshipStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getBadgeClass = () => {
    switch (status) {
      case 'pending':
        return 'badge-pending';
      case 'accepted':
      case 'approved':
        return 'badge-accepted';
      case 'rejected':
        return 'badge-rejected';
      default:
        return 'badge-pending';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Connected';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  return <span className={getBadgeClass()}>{getLabel()}</span>;
}
