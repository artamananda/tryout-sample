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

  // UTBK-style scores are coloured against 350; SKD scores against the BKN
  // passing grade of each subtest (the total row has no passing grade).
  const minScore = 350;
  const isSKD = resultData?.scoring_mode === "skd";
  const passed = (subtest: string, value: string | number) => {
    if (!isSKD) return Number(value) > minScore;
    const passingGrade = resultData?.passing_grades?.[subtest];
    return passingGrade === undefined ? null : Number(value) >= passingGrade;
  };

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
          {isSKD && resultData?.passing_grades?.[value] !== undefined && (
            <div style={{ fontWeight: 400, fontSize: 12, color: "#64748b" }}>
              PG {resultData.passing_grades[value]}
            </div>
          )}
        </div>
      ),
    },
    ...participants.map((participant) => ({
      title: participant.name,
      dataIndex: participant.user_id,
      key: participant.user_id,
      render: (value: string | number, row: TableRowData) => {
        const ok = passed(String(row.subtest), value);
        return (
          <div
            style={{
              color: ok === null ? "inherit" : ok ? "green" : "red",
              fontWeight: ok === null ? 700 : 400,
              textAlign: "center",
            }}
          >
            {value?.toString() || ""}
          </div>
        );
      },
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
