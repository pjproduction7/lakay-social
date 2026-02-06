import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

export default function Modal({ isOpen, onClose, title, children }) {
  const [visible, setVisible] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      // start closing animation
      setClosing(true);
      const t = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${closing ? 'pointer-events-none' : ''}`}>
      <div
        className={`absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-200 ${closing ? 'opacity-0' : 'opacity-100'}`}
        onClick={onClose}
      />
      <div className={`bg-white rounded-lg p-6 z-10 w-11/12 max-w-md transform transition-all duration-200 ease-out ${closing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {title && <h3 className="text-lg font-bold mb-2">{title}</h3>}
        <div className="text-sm text-gray-700 mb-4">{children}</div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
};
