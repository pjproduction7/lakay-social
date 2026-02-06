import React from 'react';
import PropTypes from 'prop-types';

export default function BigButton({ icon, label, onClick, color }) {
  return (
    <button 
      onClick={onClick} 
      className={`${color} text-white rounded-xl p-6 shadow-lg hover:scale-105 transition flex flex-col items-center gap-2`}
    >
      {icon}
      <span className="font-bold">{label}</span>
    </button>
  );
}

BigButton.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  color: PropTypes.string,
};