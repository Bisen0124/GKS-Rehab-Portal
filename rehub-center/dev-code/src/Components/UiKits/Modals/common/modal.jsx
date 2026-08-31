import React from 'react';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';

const CommonModal = (props) => {
  return (
    <Modal
      isOpen={props.isOpen}
      toggle={props.toggler}
      size={props.size}
      centered
      style={{
        maxWidth: props.maxWidth || 'auto',
        borderRadius: '14px',
      }}
      contentClassName="border-0 shadow-lg"
    >
      {props.title && (
        <ModalHeader
          toggle={props.toggler}
          className="border-bottom py-3 px-4 bg-white"
          style={{
            borderTopLeftRadius: '14px',
            borderTopRightRadius: '14px',
            fontSize: '16px',
            fontWeight: '600',
          }}
        >
          {props.title}
        </ModalHeader>
      )}
      <ModalBody
        className={`p-0 ${props.bodyClass || ''}`}
        style={{
          borderBottomLeftRadius: '14px',
          borderBottomRightRadius: '14px',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {props.children}
      </ModalBody>
    </Modal>
  );
};

export default CommonModal;