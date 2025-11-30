import { httpRequest } from "../../helpers/api";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Spin,
  Switch,
  Typography,
} from "antd";
import React from "react";
import dayjs from "dayjs";

const { Title } = Typography;

const EditProgramScreen = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm<any>();
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchProgramDetails = async () => {
      if (programId) {
        setIsLoading(true);
        try {
          const response = await httpRequest.get(`program/${programId}`);
          const res = response.data.payload;
          form.setFieldsValue({
            name: res.name,
            description: res.description,
            max_participants: res.max_participants,
            open_registration: res.open_registration
              ? dayjs(res.open_registration)
              : null,
            close_registration: res.close_registration
              ? dayjs(res.close_registration)
              : null,
            start_time: res.start_time ? dayjs(res.start_time) : null,
            end_time: res.end_time ? dayjs(res.end_time) : null,
            is_published: res.is_published,
          });
        } catch (error) {
          message.error("Gagal memuat data program");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchProgramDetails();
  }, [programId, form]);

  const handleAddEditProgram = async (values: {
    name: string;
    description: string;
    max_participants: number;
    open_registration: Date;
    close_registration: Date;
    start_time: Date;
    end_time: Date;
    is_published: boolean;
  }) => {
    try {
      if (programId) {
        const res = await httpRequest.patch(`program/${programId}`, {
          name: values.name,
          description: values.description,
          max_participants: Number(values.max_participants),
          is_published: values.is_published,
          start_time: values.start_time.toISOString(),
          end_time: values.end_time.toISOString(),
          open_registration: values.open_registration.toISOString(),
          close_registration: values.close_registration.toISOString(),
        });
        if (res) {
          message.success("Program berhasil diperbarui");
          navigate("/program");
        }
        return;
      }
      const res = await httpRequest.post("program", {
        name: values.name,
        description: values.description,
        max_participants: Number(values.max_participants),
        is_published: values.is_published,
        start_time: values.start_time.toISOString(),
        end_time: values.end_time.toISOString(),
        open_registration: values.open_registration.toISOString(),
        close_registration: values.close_registration.toISOString(),
      });
      if (res) {
        message.success("Program berhasil ditambahkan");
        navigate("/program");
      }
    } catch (error) {
      message.error("Gagal menambahkan program");
    }
  };
  return (
    <div>
      <Title level={1}>{programId ? "Edit Program" : "Tambah Program"}</Title>
      {isLoading ? (
        <Spin />
      ) : (
        <Form form={form} layout="vertical" onFinish={handleAddEditProgram}>
          <Form.Item
            label="Nama Program"
            name="name"
            required
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Deskripsi Program"
            name="description"
            required
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            label="Maksimal Peserta"
            name="max_participants"
            required
            rules={[{ required: true }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            label="Mulai Pendaftaran"
            name="open_registration"
            required
            rules={[{ required: true }]}
          >
            <DatePicker showTime={{ format: "HH:mm" }} />
          </Form.Item>
          <Form.Item
            label="Akhir Pendaftaran"
            name="close_registration"
            required
            rules={[{ required: true }]}
          >
            <DatePicker showTime={{ format: "HH:mm" }} />
          </Form.Item>
          <Form.Item
            label="Mulai Program"
            name="start_time"
            required
            rules={[{ required: true }]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            label="Akhir Program"
            name="end_time"
            required
            rules={[{ required: true }]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            label="Publikasikan Program"
            name="is_published"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Simpan Perubahan
            </Button>
          </Form.Item>
        </Form>
      )}
    </div>
  );
};
export default EditProgramScreen;
