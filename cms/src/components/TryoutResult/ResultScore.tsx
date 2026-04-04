import { Button, Table } from "antd";
import { Excel } from "antd-table-saveas-excel";
import { useEffect, useState } from "react";
import { apiGetTryoutResult } from "../../api/tryoutResult";
import { TryoutResultPayload } from "../../types/tryoutResult.type";

interface TableRowData {
  [key: string]: string | number;
  question_id: string;
  subtest: string;
}

type FixedType = "left" | "right" | boolean;

const ResultScore = () => {
  const tryoutId = window.location.href.split("/").pop();
  const [resultData, setResultData] = useState<TryoutResultPayload | null>(
    null,
  );
  const [newDataSource, setNewDataSource] = useState<TableRowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const minScore = 350;

  useEffect(() => {
    const fetchTryoutResult = async () => {
      if (!tryoutId) {
        setIsLoading(false);
        return;
      }

      const res = await apiGetTryoutResult(tryoutId);
      if (res?.data?.payload?.results?.[0]) {
        setResultData(res.data.payload.results[0]);
      }
      setIsLoading(false);
    };

    fetchTryoutResult();
  }, [tryoutId]);

  const participants = resultData?.participants || [];

  const columns = [
    {
      title: "Subtest",
      dataIndex: "subtest",
      key: "subtest",
      fixed: "left" as FixedType,
      render: (value: string) => (
        <div style={{ fontWeight: "bold" }}>
          {value ? value?.toUpperCase() : "-"}
        </div>
      ),
    },
    ...participants.map((participant) => ({
      title: participant.name,
      dataIndex: participant.user_id,
      key: participant.user_id,
      render: (value: string | number) => (
        <div
          style={{
            color: Number(value) > minScore ? "green" : "red",
            textAlign: "center",
          }}
        >
          {value?.toString() || ""}
        </div>
      ),
    })),
  ];

  useEffect(() => {
    const rows = (resultData?.score_rows || []).map((row) => ({
      question_id: row.subtest,
      subtest: row.subtest,
      ...row.scores,
    }));
    setNewDataSource(rows);
  }, [resultData]);

  const handlePrint = () => {
    const excel = new Excel();
    excel
      .addSheet("sheet 1")
      .addColumns(columns)
      .addDataSource(newDataSource, {
        str2Percent: true,
      })
      .saveAs(`score_${tryoutId || "result"}.xlsx`);
  };

  return (
    <div>
      <Table
        dataSource={newDataSource}
        loading={isLoading}
        columns={columns}
        pagination={false}
      />
      <div
        style={{
          margin: 20,
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <Button
          style={{
            padding: 20,
            fontWeight: "bold",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
          type="primary"
          onClick={handlePrint}
          disabled={isLoading}
        >
          Download
        </Button>
      </div>
    </div>
  );
};

export default ResultScore;
