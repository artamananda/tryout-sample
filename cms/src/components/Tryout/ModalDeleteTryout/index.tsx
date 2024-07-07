import { Button, Form, message, Modal } from 'antd';
import Title from 'antd/es/typography/Title';
import { apiDeleteTryout } from '../../../api/tryout';

type PropTypes = {
  showModalDelete: any;
  setShowModalDelete: any;
  onFinishFailed: (errorInfo: any) => void;
  fetchList: () => void;
};

const ModalDeleteTryout = (props: PropTypes) => {
  const { showModalDelete, setShowModalDelete, onFinishFailed, fetchList } = props;
  const handleDelete = async () => {
    await apiDeleteTryout(showModalDelete.tryoutId);
    fetchList();
    setShowModalDelete({ status: false, tryoutId: '' });
    message.success('Success Delete');
  };
  return (
    <Modal
      open={showModalDelete.status}
      onCancel={() => setShowModalDelete({ status: false, tryoutId: '' })}
      footer={false}
    >
      <Title
        level={4}
        style={{ fontWeight: 'semibold' }}
      >
        Are you sure to delete this tryout?
      </Title>
      <Form
        name="deleteTryout"
        onFinish={handleDelete}
        onFinishFailed={onFinishFailed}
        // initialValues={{ is_published: false }}
        layout="vertical"
      >
        <Form.Item style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', justifyContent: 'end' }}>
          <Button
            danger
            type="default"
            htmlType="button"
            onClick={() => setShowModalDelete({ status: false, tryoutId: '' })}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            style={{ marginLeft: '10px' }}
          >
            Delete
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalDeleteTryout;
