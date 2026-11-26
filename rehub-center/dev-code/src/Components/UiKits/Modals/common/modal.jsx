import React from 'react';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';

const CommonModal = (props) => {
  const resolvedMaxWidth = props.maxWidth
    ? `min(${props.maxWidth}, calc(100vw - 20px))`
    : undefined;

  return (
    <Modal
      isOpen={props.isOpen}
      toggle={props.toggler}
      size={props.size}
      centered
      className={`gks-common-modal ${props.className || ''}`.trim()}
      style={{
        ...(resolvedMaxWidth ? { maxWidth: resolvedMaxWidth } : {}),
        width: '100%',
        borderRadius: '14px',
      }}
      contentClassName="border-0 shadow-lg"
    >
      {props.title && (
        <ModalHeader
          toggle={props.toggler}
          className="border-bottom py-2 py-md-3 px-3 px-md-4 bg-white"
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
          maxHeight: 'calc(100dvh - 120px)',
          overflowY: 'auto',
        }}
      >
        {props.children}
      </ModalBody>
    </Modal>
  );
};

export default CommonModal;