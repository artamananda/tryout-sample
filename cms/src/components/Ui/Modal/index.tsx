import React from 'react';
import { Modal } from 'antd';

type PropTypes = {
  children?: any;
  title: string;
  isModalOpen: any;
  handleCancel?: any;
  handleOk?: any;
};

const ModalUi = (props: PropTypes) => {
  const { children, title, isModalOpen, handleCancel, handleOk } = props;

  return (
    <Modal
      title={title}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      width={'50%'}
    >
      {children}
    </Modal>
  );
};

export default ModalUi;
