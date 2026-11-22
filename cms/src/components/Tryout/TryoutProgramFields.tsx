import { useEffect, useState } from "react";
import { Col, Form, InputNumber, Row, Select, Typography } from "antd";
import { httpRequest } from "../../helpers/api";

const { Text } = Typography;

type ProgramOption = { program_id: string; name: string };

/**
 * Program, TO number and scoring mode of a tryout. A tryout linked to a
 * program is only open to its participants; the TO number decides which
 * packages include it (Premium = TO 1-5, Eksekutif = TO 1-10, ...).
 */
const TryoutProgramFields = () => {
  const [programs, setPrograms] = useState<ProgramOption[]>([]);

  useEffect(() => {
    httpRequest
      .get("/program")
      .then((res) => setPrograms(res.data?.payload?.results || []))
      .catch(() => setPrograms([]));
  }, []);

  return (
    <>
      <Form.Item
        label="Program / Gelombang"
        name="program_id"
        extra="Kosongkan untuk tryout umum yang bisa diikuti semua user."
      >
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Tryout umum (tanpa program)"
          options={programs.map((program) => ({ value: program.program_id, label: program.name }))}
        />
      </Form.Item>
      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item
            label="TO ke-"
            name="sequence"
            extra="Urutan TO dalam program. 0 = semua paket bisa mengikuti."
          >
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Penilaian" name="scoring_mode">
            <Select
              options={[
                { value: "irt", label: "UTBK (skor berbobot 350-1000)" },
                { value: "skd", label: "SKD CPNS (TWK/TIU 5-0, TKP 1-5)" },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>
      <Text type="secondary" style={{ display: "block", marginTop: -8, marginBottom: 16 }}>
        Mode SKD: skor & peringkat langsung muncul setelah peserta selesai, pembahasan dibuka setelah End Time.
      </Text>
    </>
  );
};

export default TryoutProgramFields;
