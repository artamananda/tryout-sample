import { useEffect, useState } from 'react';
import QuestionView from '../../components/views/Questions';
import { fetchQuestions } from '../../api/question';
import { QuestionProps } from '../../types/question';

const QuestionPage = () => {
  const url = new URL(window.location.href);
  const pathname = url.pathname;
  const parts = pathname.split('/');
  const tryoutId = parts[parts.length - 3];
  const questionType = parts[parts.length - 1];
  const [questionList, setQuestionList] = useState<QuestionProps[]>([]);
  const [loading, setIsLoading] = useState(true);

  const scrollTop = () => {
    window.scrollTo({
      behavior: 'smooth',
      top: 0,
    });
  };

  const fetchDataQuestion = async () => {
    const questionList = await fetchQuestions(tryoutId, questionType);
    const questions = questionList.sort((a: any, b: any) => a.local_id - b.local_id);
    setQuestionList(questions);
    if (Object.keys(questionList).length > 0) {
      setIsLoading(false);
    } else {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };
  console.log(questionList);

  useEffect(() => {
    fetchDataQuestion();
    scrollTop();
  }, []);

  return (
    <QuestionView
      questionList={questionList}
      questionType={questionType}
      tryoutId={tryoutId}
      setQuestionList={setQuestionList}
      loading={loading}
    />
  );
};

export default QuestionPage;
