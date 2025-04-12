import service from "@/utils/request";

export function getContestListService(params) {
    return service({
        url: "/contest/semi/login/cache/list",
        method: "get",
        params,
    });
}

// export function getExamRankListService(params) {
//   return service({
//     url: "/exam/rank/list",
//     method: "get",
//     params,
//   });
// }

export function enterContestService(enterContestRequest) {
    return service({
        url: "/user/contest/enter",
        method: "post",
        data: enterContestRequest,
    });
}

// export function getMyExamListService(params = {}) {
//   return service({
//     url: "/user/exam/list",
//     method: "get",
//     params,
//   });
// }

// export function getExamFirstQuestionService(examId) {
//   return service({
//     url: "/exam/getFirstQuestion",
//     method: "get",
//     params: { examId },
//   });
// }

// export function examPreQuestionService(examId, questionId) {
//   return service({
//     url: "/exam/preQuestion",
//     method: "get",
//     params: { examId,questionId},
//   });
// }

// export function examNextQuestionService(examId, questionId) {
//   return service({
//     url: "/exam/nextQuestion",
//     method: "get",
//     params: { examId, questionId },
//   });
// }