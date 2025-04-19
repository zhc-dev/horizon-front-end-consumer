import service from "@/utils/request";

export function getContestListService(params) {
    return service({
        url: "/contest/semi/login/cache/list",
        method: "get",
        params,
    });
}

export function getExamRankListService(params) {
  return service({
    url: "/exam/rank/list",
    method: "get",
    params,
  });
}

export function enterContestService(enterContestRequest) {
    return service({
        url: "/user/contest/enter",
        method: "post",
        data: enterContestRequest,
    });
}

export function getUserContestListService(params = {}) {
    return service({
        url: "/user/contest/list",
        method: "get",
        params,
    });
}

export function getContestFirstQuestionService(contestId) {
  return service({
    url: "/contest/first",
    method: "get",
    params: { contestId },
  });
}

export function contestPreviousQuestionService(contestId, questionId) {
  return service({
    url: "/contest/pre",
    method: "get",
    params: { contestId,questionId},
  });
}

export function examNextQuestionService(contestId, questionId) {
  return service({
    url: "/contest/next",
    method: "get",
    params: { contestId: contestId, questionId },
  });
}