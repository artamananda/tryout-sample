import React from "react";
import { Modal } from "antd";

type PropTypes = {
  children?: any;
  title: string;
  isModalOpen: any;
  handleCancel?: any;
  handleOk?: any;
  zIndex?: number;
};

const ModalUi = (props: PropTypes) => {
  const { children, title, isModalOpen, handleCancel, handleOk, zIndex } =
    props;

  return (
    <Modal
      title={title}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      width={"50%"}
      footer={null}
      zIndex={zIndex}
    >
      {children}
    </Modal>
  );
};

export default ModalUi;
