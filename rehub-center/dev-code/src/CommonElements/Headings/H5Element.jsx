import React from 'react';

const H5 = ({ children, attrH5 = {}, className = '', ...rest }) => {
  return (
    <h5 className={`${className} ${attrH5.className || ''}`} {...attrH5} {...rest}>
      {children}
    </h5>
  );
};

export default H5;
