import { Button, Table } from "antd";
import { Excel } from "antd-table-saveas-excel";
import { useEffect, useState } from "react";
import { apiGetUserAnswer } from "../../api/userAnswer";
import { UserAnswerProps } from "../../types/userAnswer.type";
import { apiGetUsers } from "../../api/user";
import useFetchList from "../../hooks/useFetchList";
import { QuestionProps } from "../../types/question";
import { sortBy } from "lodash";

interface TableRowData {
  [key: string]: string;
  question_id: string;
}

type FixedType = "left" | "right" | boolean;

const ResultTable = () => {
  const tryoutId = "f9d32639-9bbd-4c06-acb5-a2f181d5a310";
  const [userAnswers, setUserAnswers] = useState<UserAnswerProps[]>([]);
  const [users, setUsers] = useState<{ user_id: string; name: string }[]>([]);
  const [uniqueUserIds, setUniqueUserIds] = useState<string[]>([]);
  const [user, setUser] = useState<{ [key: string]: string }>({});
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [questionTypes, setQuestionTypes] = useState<{ [key: string]: string }>(
    {}
  );

  const { data: questionData } = useFetchList<QuestionProps>({
    endpoint: "tryout/question/" + tryoutId,
  });

  useEffect(() => {
    const ans: { [key: string]: string } = {};
    const qType: { [key: string]: string } = {};
    questionData.forEach((item) => {
      ans[item.question_id] = item.correct_answer;
      qType[item.question_id] = item.type;
    });
    setAnswers(ans);
    setQuestionTypes(qType);
  }, [questionData]);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await apiGetUsers();
      if (res) {
        setUsers(res.data.payload.results);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchAnswer = async () => {
      const res = await apiGetUserAnswer();
      if (res && users) {
        const answersTmp = res.data.payload.results.filter(
          (item) => item.tryout_id === tryoutId
        );
        setUserAnswers(answersTmp);

        const newUser: { [key: string]: string } = {};
        users.forEach((item) => {
          newUser[item.user_id] = item.name;
        });
        setUser(newUser);

        const newIds = answersTmp
          .map((item) => item.user_id)
          .filter((id, index, self) => self.indexOf(id) === index);
        setUniqueUserIds(newIds);
      }
    };
    fetchAnswer();
  }, [users]);

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
        <div style={{ fontWeight: "bold" }}>{value?.toUpperCase()}</div>
      ),
    },
    // Menambahkan kolom untuk setiap user ID yang unik
    ...uniqueUserIds.map((userId) => ({
      title: user[userId],
      dataIndex: userId,
      key: userId,
      render: (value: string) => (
        <div
          style={{
            backgroundColor:
              value === "X" ? "red" : value === "V" ? "green" : undefined,
            color: value ? "white" : "grey",
            textAlign: "center",
            fontStyle: !value ? "italic" : undefined,
            borderRadius: "100px",
            width: 25,
          }}
        >
          {value || "Not Set"}
        </div>
      ),
    })),
  ];

  // Menyiapkan data untuk tabel
  const dataSource: TableRowData[] = [];
  userAnswers.forEach((answer) => {
    const existingRow = dataSource.find(
      (row) => row.question_id === answer.question_id
    );
    if (existingRow) {
      existingRow[answer.user_id] =
        answer.user_answer === answers[answer.question_id] ? "V" : "X";
    } else {
      const newRow: TableRowData = {
        question_id: answer.question_id,
        subtest: questionTypes[answer.question_id],
        [answer.user_id]:
          answer.user_answer === answers[answer.question_id] ? "V" : "X",
      };
      dataSource.push(newRow);
    }
  });

  const handlePrint = () => {
    const excel = new Excel();
    excel
      .addSheet("sheet 1")
      .addColumns(columns)
      .addDataSource(sortBy(dataSource, "subtest"), {
        str2Percent: true,
      })
      .saveAs("Excel.xlsx");
  };

  return (
    <div>
      <Table
        dataSource={sortBy(dataSource, "subtest")}
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
        >
          Download
        </Button>
      </div>
    </div>
  );
};

export default ResultTable;
