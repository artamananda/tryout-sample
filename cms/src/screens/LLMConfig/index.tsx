import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Typography,
  Divider,
  Spin,
  message,
  Tag,
} from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import { apiGetSystemConfigs, apiUpdateSystemConfig, SystemConfig } from "../../api/systemConfig";

const { Title, Text, Paragraph } = Typography;

const PROVIDER_OPTIONS = [
  { value: "gemini", label: "Google Gemini" },
  { value: "openai", label: "OpenAI" },
];

const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  gemini: [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Recommended)" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  ],
  openai: [
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Recommended)" },
    { value: "gpt-4o", label: "GPT-4o" },
  ],
};

interface CategoryConfig {
  provider: string;
  apiKey: string;
  model: string;
}

const LLMConfigScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"utbk" | "skd" | null>(null);
  const [utbkConfig, setUtbkConfig] = useState<CategoryConfig>({ provider: "gemini", apiKey: "", model: "" });
  const [skdConfig, setSkdConfig] = useState<CategoryConfig>({ provider: "gemini", apiKey: "", model: "" });

  useEffect(() => {
    document.title = "LLM Config - CMS";
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    const configs = await apiGetSystemConfigs();
    const byKey: Record<string, string> = {};
    configs.forEach((c: SystemConfig) => { byKey[c.key] = c.value; });

    setUtbkConfig({
      provider: byKey["llm_utbk_provider"] || "gemini",
      apiKey: byKey["llm_utbk_api_key"] || "",
      model: byKey["llm_utbk_model"] || "",
    });
    setSkdConfig({
      provider: byKey["llm_skd_provider"] || "gemini",
      apiKey: byKey["llm_skd_api_key"] || "",
      model: byKey["llm_skd_model"] || "",
    });
    setLoading(false);
  };

  const saveCategory = async (cat: "utbk" | "skd") => {
    setSaving(cat);
    const cfg = cat === "utbk" ? utbkConfig : skdConfig;
    const prefix = cat === "utbk" ? "llm_utbk" : "llm_skd";
    const results = await Promise.all([
      apiUpdateSystemConfig(`${prefix}_provider`, cfg.provider),
      apiUpdateSystemConfig(`${prefix}_api_key`, cfg.apiKey),
      apiUpdateSystemConfig(`${prefix}_model`, cfg.model),
    ]);
    if (results.every(Boolean)) {
      message.success(`Konfigurasi LLM ${cat.toUpperCase()} berhasil disimpan`);
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 0", maxWidth: 800 }}>
      <Title level={2} style={{ margin: 0, marginBottom: 8, fontWeight: 700 }}>
        LLM Config
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 32 }}>
        Atur token API untuk generator soal masing-masing kategori. Jika kosong, sistem akan menggunakan nilai dari <code>.env</code>.
        Token yang diset di sini akan menggantikan nilai <code>.env</code> untuk kategori tersebut.
      </Paragraph>

      {/* UTBK Config */}
      <Card
        bordered={false}
        style={{ borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        bodyStyle={{ padding: 28 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Title level={4} style={{ margin: 0 }}>Bank Soal UTBK</Title>
          <Tag color="blue">KPU · PPU · PBM · PKU · IND · ING · MTK</Tag>
        </div>

        <Form layout="vertical">
          <Form.Item label="AI Provider">
            <Select
              value={utbkConfig.provider}
              options={PROVIDER_OPTIONS}
              onChange={(v) => setUtbkConfig({ ...utbkConfig, provider: v, model: "" })}
              style={{ width: 240 }}
            />
          </Form.Item>

          <Form.Item label="API Key" extra={<Text type="secondary" style={{ fontSize: 12 }}>Nilai saat ini: {utbkConfig.apiKey ? "●●●●●●●●" + utbkConfig.apiKey.slice(-4) : "Belum diset (pakai .env)"}</Text>}>
            <Input.Password
              placeholder="Masukkan API Key baru (kosongkan untuk tetap menggunakan nilai lama)"
              value={utbkConfig.apiKey}
              onChange={(e) => setUtbkConfig({ ...utbkConfig, apiKey: e.target.value })}
            />
          </Form.Item>

          <Form.Item label="Model (opsional)">
            <Select
              value={utbkConfig.model}
              placeholder="Default sesuai provider"
              allowClear
              options={MODEL_OPTIONS[utbkConfig.provider] || []}
              onChange={(v) => setUtbkConfig({ ...utbkConfig, model: v || "" })}
              style={{ width: 300 }}
            />
          </Form.Item>
        </Form>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving === "utbk"}
          onClick={() => saveCategory("utbk")}
          style={{ background: "#8C59F1", border: "none", borderRadius: 8 }}
        >
          Simpan Konfigurasi UTBK
        </Button>
      </Card>

      {/* SKD CPNS Config */}
      <Card
        bordered={false}
        style={{ borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        bodyStyle={{ padding: 28 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Title level={4} style={{ margin: 0 }}>Bank Soal SKD CPNS</Title>
          <Tag color="gold">TWK · TIU · TKP</Tag>
        </div>

        <Form layout="vertical">
          <Form.Item label="AI Provider">
            <Select
              value={skdConfig.provider}
              options={PROVIDER_OPTIONS}
              onChange={(v) => setSkdConfig({ ...skdConfig, provider: v, model: "" })}
              style={{ width: 240 }}
            />
          </Form.Item>

          <Form.Item label="API Key" extra={<Text type="secondary" style={{ fontSize: 12 }}>Nilai saat ini: {skdConfig.apiKey ? "●●●●●●●●" + skdConfig.apiKey.slice(-4) : "Belum diset (pakai .env)"}</Text>}>
            <Input.Password
              placeholder="Masukkan API Key baru (kosongkan untuk tetap menggunakan nilai lama)"
              value={skdConfig.apiKey}
              onChange={(e) => setSkdConfig({ ...skdConfig, apiKey: e.target.value })}
            />
          </Form.Item>

          <Form.Item label="Model (opsional)">
            <Select
              value={skdConfig.model}
              placeholder="Default sesuai provider"
              allowClear
              options={MODEL_OPTIONS[skdConfig.provider] || []}
              onChange={(v) => setSkdConfig({ ...skdConfig, model: v || "" })}
              style={{ width: 300 }}
            />
          </Form.Item>
        </Form>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving === "skd"}
          onClick={() => saveCategory("skd")}
          style={{ background: "#d4a017", border: "none", borderRadius: 8 }}
        >
          Simpan Konfigurasi SKD CPNS
        </Button>
      </Card>

      <Button icon={<ReloadOutlined />} onClick={loadConfigs}>
        Refresh
      </Button>
    </div>
  );
};

export default LLMConfigScreen;
