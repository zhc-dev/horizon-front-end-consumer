import service from "@/utils/request";

export function getQuestionListService(params) {
  return service({
    url: "/question/semi/login/list",
    method: "get",
    params,
  });
}

export function getHotQuestionListService() {
  return service({
    url: "/question/semiLogin/hotList",
    method: "get"
  });
}

export function getQuestionDetailService(questionId) {
  return service({
    url: "/question/detail",
    method: "get",
    params: { questionId },
  });
}

export function previousQuestionService(questionId) {
  return service({
    url: "/question/pre",
    method: "get",
    params: { questionId },
  });
}

export function nextQuestionService(questionId) {
  return service({
    url: "/question/next",
    method: "get",
    params: { questionId },
  });
}

export function getQuestionResultService(examId, questionId, currentTime) {
  return service({
    url: "/user/question/exe/result",
    method: "get",
    params: { examId, questionId, currentTime }
  });
}