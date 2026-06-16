import { Button, Table } from "antd";
import { Excel } from "antd-table-saveas-excel";
import { useEffect, useState } from "react";
import { apiGetTryoutResult } from "../../api/tryoutResult";
import { TryoutResultPayload } from "../../types/tryoutResult.type";

interface TableRowData {
  [key: string]: string;
  question_id: string;
  subtest: string;
}

type FixedType = "left" | "right" | boolean;

const ResultTable = () => {
  const tryoutId = window.location.href.split("/").pop();
  const [resultData, setResultData] = useState<TryoutResultPayload | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

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
  const dataSource: TableRowData[] = (resultData?.result_rows || []).map(
    (row) => ({
      question_id: row.question_id,
      subtest: row.subtest,
      ...row.marks,
    }),
  );

  // Menyiapkan kolom-kolom tabel
  const columns = [
    {
      title: "No.",
      dataIndex: "no",
      key: "no",
      fixed: "left" as FixedType,
      render: (_: any, __: any, index: number) => index + 1,
    },
    // {
    //   title: "Question ID",
    //   dataIndex: "question_id",
    //   key: "question_id",
    // },
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
    // Menambahkan kolom untuk setiap user ID yang unik
    ...participants.map((participant) => ({
      title: participant.name,
      dataIndex: participant.user_id,
      key: participant.user_id,
      render: (value: string) => (
        <div
          style={{
            backgroundColor:
              value === "X" ? "red" : value === "V" ? "green" : "gray",
            color: "white",
            textAlign: "center",
            borderRadius: "200px",
            fontWeight: "bold",
            width: 25,
            height: 25,
          }}
        >
          {value || "-"}
        </div>
      ),
    })),
  ];

  const handlePrint = () => {
    const excel = new Excel();
    excel
      .addSheet("sheet 1")
      .addColumns(columns)
      .addDataSource(dataSource, {
        str2Percent: true,
      })
      .saveAs(`${tryoutId || "result"}.xlsx`);
  };

  return (
    <div>
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        loading={isLoading}
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

export default ResultTable;
