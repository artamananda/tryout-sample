import FormQuestion from '../views/FormQuestion';

const FormMtk = () => {
  const questionLength = 20;
  const url = new URL(window.location.href);
  const pathname = url.pathname;
  const parts = pathname.split('/');
  const tryoutId = parts[parts.length - 4];
  const questionType = parts[parts.length - 1];

  return (
    <FormQuestion
      questionType={questionType}
      tryoutId={tryoutId}
      questionLength={questionLength}
      title="Penalaran Matematika"
    />
  );
};

export default FormMtk;
