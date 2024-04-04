import { Button, Table } from "antd";
import { Excel } from "antd-table-saveas-excel";
import { useEffect, useState } from "react";
import { apiGetUserAnswer } from "../../api/userAnswer";
import { UserAnswerProps } from "../../types/userAnswer.type";
import { apiGetUsers } from "../../api/user";
import useFetchList from "../../hooks/useFetchList";
import { QuestionProps } from "../../types/question";

interface TableRowData {
  [key: string]: string | number;
  question_id: string;
  subtest: string;
}

interface Score {
  point: number;
  question_id: string;
  subtest: string;
}

type FixedType = "left" | "right" | boolean;

const ResultScore = () => {
  const tryoutId = "f9d32639-9bbd-4c06-acb5-a2f181d5a310";
  const [userAnswers, setUserAnswers] = useState<UserAnswerProps[]>([]);
  const [users, setUsers] = useState<{ user_id: string; name: string }[]>([]);
  const [uniqueUserIds, setUniqueUserIds] = useState<string[]>([]);
  const [user, setUser] = useState<{ [key: string]: string }>({});
  const [scores, setScores] = useState<Score[]>([]);
  const [oldDataSource, setOldDataSource] = useState<TableRowData[]>([]);
  const [newDataSource, setNewDataSource] = useState<TableRowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [questionTypes, setQuestionTypes] = useState<{ [key: string]: string }>(
    {}
  );

  const { data: questionData } = useFetchList<QuestionProps>({
    endpoint: "tryout/question/" + tryoutId,
  });

  useEffect(() => {
    const fetchUser = async () => {
      const res = await apiGetUsers();
      if (res) {
        const resultTmp = res.data.payload.results.filter(
          (item) => item.name.split(" ")?.[0] !== "Test"
        );
        setUsers(resultTmp);
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
          .filter(
            (id, index, self) =>
              self.indexOf(id) === index &&
              users.find((item) => item.user_id === id)
          );
        setUniqueUserIds(newIds);
      }
    };
    fetchAnswer();
  }, [users]);

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

  // Menyiapkan kolom-kolom tabel
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
    // Menambahkan kolom untuk setiap user ID yang unik
    ...uniqueUserIds.map((userId) => ({
      title: user[userId],
      dataIndex: userId,
      key: userId,
      render: (value: string | number) => (
        <div
          style={{
            backgroundColor: Number(value) > 0 ? "green" : "red",
            color: "white",
            textAlign: "center",
            borderRadius: "100px",
            width: 25,
          }}
        >
          {value || 0}
        </div>
      ),
    })),
  ];

  // Menyiapkan data untuk tabel
  useEffect(() => {
    let dataSource: TableRowData[] = [];
    userAnswers.forEach((answer) => {
      const existingRow = dataSource.find(
        (row) => row.question_id === answer.question_id
      );
      if (existingRow) {
        existingRow[answer.user_id] =
          answer.user_answer === answers[answer.question_id] ? 1 : 0;
      } else {
        const newRow: TableRowData = {
          question_id: answer.question_id,
          subtest: questionTypes[answer.question_id],
          [answer.user_id]:
            answer.user_answer === answers[answer.question_id] ? 1 : 0,
        };
        dataSource.push(newRow);
      }
    });

    setOldDataSource(dataSource);
  }, [userAnswers]);

  useEffect(() => {
    let scoreArr: any = [];
    oldDataSource.map((item) => {
      let countTrue = 0;
      let countTotal = 0;
      uniqueUserIds.forEach((userId) => {
        if (Number(item[userId]) === 1) {
          countTrue++;
        }
        countTotal++;
      });
      const scoreRes = countScore(countTrue, countTotal, item.subtest);
      const newScore: Score = {
        question_id: item.question_id,
        subtest: item.subtest,
        point: scoreRes,
      };
      scoreArr.push(newScore);
    });
    setScores(scoreArr);
  }, [oldDataSource]);

  const countScore = (
    countTrue: number,
    countTotal: number,
    subtest: string
  ) => {
    const percentIsTrue = (countTrue / countTotal) * 100;
    const maxScore = 800;
    if (subtest === "kpu" || subtest === "bind") {
      const defaultScore = maxScore / 30;
      return ((100 - percentIsTrue) / 100) * defaultScore;
    } else if (
      subtest === "ppu" ||
      subtest === "pbm" ||
      subtest === "bing" ||
      subtest === "mtk"
    ) {
      const defaultScore = maxScore / 20;
      return ((100 - percentIsTrue) / 100) * defaultScore;
    } else if (subtest === "pku") {
      const defaultScore = maxScore / 15;
      return ((100 - percentIsTrue) / 100) * defaultScore;
    } else {
      return 0;
    }
  };

  useEffect(() => {
    userAnswers.forEach((answer) => {
      const existingRow = oldDataSource.find(
        (row) => row.question_id === answer.question_id
      );
      if (existingRow) {
        existingRow[answer.user_id] =
          answer.user_answer === answers[answer.question_id]
            ? scores.find((item) => item.question_id === answer.question_id)
                ?.point || 0
            : 0;
      } else {
        const newRow: TableRowData = {
          question_id: answer.question_id,
          subtest: questionTypes[answer.question_id],
          [answer.user_id]:
            answer.user_answer === answers[answer.question_id]
              ? scores.find((item) => item.question_id === answer.question_id)
                  ?.point || 0
              : 0,
        };
        oldDataSource.push(newRow);
      }
    });

    const typeOrder = ["kpu", "ppu", "pbm", "pku", "ind", "ing", "mtk"];
    const newSortedDataSource: TableRowData[] = [];
    const totalScore = (subtestTyped: string) => {
      uniqueUserIds.map((userId) => {
        const subtestType = subtestTyped;
        let userScore = 250;
        oldDataSource.map((oldDataItem) =>
          oldDataItem.subtest === subtestType && oldDataItem[userId]
            ? (userScore += Number(oldDataItem[userId]))
            : (userScore += 0)
        );
        const existingRow = newSortedDataSource.find(
          (row) => row.question_id === subtestType
        );
        if (existingRow) {
          existingRow[userId] = Math.round(userScore);
        } else {
          const newRowData: TableRowData = {
            question_id: subtestType,
            subtest: subtestType,
            [userId]: Math.round(userScore),
          };
          newSortedDataSource.push(newRowData);
        }
      });
    };
    typeOrder.forEach((item) => totalScore(item));
    setNewDataSource(newSortedDataSource);
  }, [scores]);

  useEffect(() => {
    if (newDataSource.length !== 0) {
      setIsLoading(false);
    }
  }, [newDataSource]);

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
