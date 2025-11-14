import Modal from './Modal';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BulkImportModal = ({ isOpen, onClose, onSuccess }: BulkImportModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Products">
      <div className="p-6">
        <p className="text-gray-600">Bulk import modal - Implementation in progress</p>
        <p className="text-sm text-gray-500 mt-2">CSV/Excel import coming soon</p>
      </div>
    </Modal>
  );
};

export default BulkImportModal;
