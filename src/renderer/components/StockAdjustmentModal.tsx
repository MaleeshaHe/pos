import Modal from './Modal';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: any;
}

const StockAdjustmentModal = ({ isOpen, onClose, onSuccess, product }: StockAdjustmentModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Adjustment">
      <div className="p-6">
        <p className="text-gray-600">Stock adjustment modal - Implementation in progress</p>
        <p className="text-sm text-gray-500 mt-2">Product: {product.name}</p>
        <p className="text-sm text-gray-500">Current Stock: {product.stock} {product.unit}</p>
      </div>
    </Modal>
  );
};

export default StockAdjustmentModal;
