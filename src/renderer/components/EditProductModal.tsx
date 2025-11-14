import Modal from './Modal';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: any;
}

const EditProductModal = ({ isOpen, onClose, onSuccess, product }: EditProductModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Product">
      <div className="p-6">
        <p className="text-gray-600">Edit product modal - Implementation in progress</p>
        <p className="text-sm text-gray-500 mt-2">Product: {product.name}</p>
      </div>
    </Modal>
  );
};

export default EditProductModal;
