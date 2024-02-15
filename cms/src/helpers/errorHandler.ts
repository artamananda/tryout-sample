export function getErrorMessage(err: any) {
  let errMessage = "Failed. Please try again.";

  if (err && typeof err === "string") {
    errMessage = err;
  } else if (err && err.response) {
    if (err.response.data && err.response.data.message) {
      errMessage = err.response.data.message;
    } else if (err.response.message) {
      errMessage = err.response.message;
    } else {
      errMessage = JSON.stringify(err.response) + " [000]";
    }
  } else if (err && err.data) {
    if (err.data.message) {
      errMessage = err.data.message;
    } else {
      errMessage = JSON.stringify(err.data) + " [001] ";
    }
  } else if (err.message) {
    errMessage = err.message;
  } else {
    errMessage = JSON.stringify(err) + " [009]";
  }
  return errMessage;
}
