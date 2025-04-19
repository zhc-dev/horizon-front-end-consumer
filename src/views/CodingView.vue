<template>
  <div class="page praticle-page flex-col">
    <div class="box_1 flex-row">
      <div class="group_1 ">
        <img class="label_4" src="@/assets/ide/liebiao.png" />
        <span>{{ contestTitle ? contestTitle : '精选题库' }}</span>
        <el-countdown v-if="contestEndTime && new Date() < new Date(contestEndTime)" class="exam-time-countdown"
          @finish="handleCountdownFinish" title="距离竞赛结束还有:" :value="new Date(contestEndTime)" />
      </div>
      <div class="group_2">
        <el-button type="primary" plain @click="submitQuestion">提交代码</el-button>
      </div>
      <span class="ide-back" @click="goBack()">返回</span>
    </div>
    <div class="box_8 flex-col">
      <div class="group_12 flex-row justify-between">
        <div class="image-wrapper_1 flex-row">
          <img class="thumbnail_2" src="@/assets/ide/xiaobiaoti.png" />
          <div class="question-nav">
            <span>题目描述</span>
          </div>
          <div class="question-nav" @click="preQuestion">
            <el-icon>
              <ArrowLeft />
              <span>上一题</span>
            </el-icon>
          </div>
          <div class="question-nav" @click="nextQuestion">
            <el-icon>
              <ArrowRight />
              <span>下一题</span>
            </el-icon>
          </div>
        </div>
        <div class="image-wrapper_2 flex-row">
          <img class="image_1" src="@/assets/ide/daima.png" />
          代码
        </div>
      </div>
      <div class="group_13 flex-row justify-between">
        <div class="box_3 flex-col">
          <span class="question-title">{{ questionDetail.title }}</span>
          <span class="question-limit">
            <div v-if="questionDetail.difficulty === 1">题目难度：简单 时间限制：{{ questionDetail.timeLimit }} ms 空间限制：{{
              questionDetail.spaceLimit }} 字节</div>
            <div v-if="questionDetail.difficulty === 2">题目难度：中等 时间限制：{{ questionDetail.timeLimit }} ms 空间限制：{{
              questionDetail.spaceLimit }} 字节</div>
            <div v-if="questionDetail.difficulty === 3">题目难度：困难 时间限制：{{ questionDetail.timeLimit }} ms 空间限制：{{
              questionDetail.spaceLimit }} 字节</div>
          </span>
          <span class="question-content" v-html="questionDetail.content"></span>
        </div>
        <div class="group_14 flex-col">
          <div class="group_8 flex-col">
            <codeEditor
              ref="defaultCodeRef"
              :language-options="questionLanguages"
              @update:value="handleEditorContent"
            >
            </codeEditor>
          </div>
          <div class="code-result flex-row">
            <img class="code-result-image" src="@/assets/ide/codeResult.png" />
            <span class="code-result-content">执行结果</span>
          </div>
          <div class="group_15 flex-row">
            <div class="section_1 flex-row">
              <div class="section_3 flex-col">
                <div class="text-wrapper_2 flex-row justify-between">
                  <span class="text_1 red" v-if="userQuestionResultVO.pass === 0">未通过</span>
                  <span class="text_1 success" v-if="userQuestionResultVO.pass === 1">通过</span>
                  <span class="text_1 warning" v-if="userQuestionResultVO.pass === 2">请先执行代码</span>
                  <span class="text_1 info" v-if="userQuestionResultVO.pass === 3">系统正在处理您的代码，请稍后</span>
                </div>
                <span class="error-text" v-if="userQuestionResultVO.pass === 0">异常信息：{{
                  userQuestionResultVO.exeMessage }}</span>
                <el-table v-if="userQuestionResultVO.userExeResultList && userQuestionResultVO.userExeResultList.length > 0"
                  :data="userQuestionResultVO.userExeResultList">
                  <el-table-column prop="input" label="输入" />
                  <el-table-column prop="output" label="预期结果" />
                  <el-table-column prop="exeOutput" label="实际输出" />
                </el-table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue"; // 引入 onMounted (如果需要)
import codeEditor from "@/components/CodeEditor.vue"; // 确保路径正确
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import { useRoute } from "vue-router";
import { getQuestionDetailService, previousQuestionService, nextQuestionService, getQuestionResultService } from "@/apis/question"; // 确保路径正确
import router from "@/router"; // 确保路径正确
import { examNextQuestionService, contestPreviousQuestionService, getContestFirstQuestionService } from "@/apis/contest"; // 确保路径正确
import { ElMessage } from "element-plus";
import { userSubmitService } from "@/apis/user"; // 确保路径正确

function goBack() {
  router.go(-1);
}

const questionDetail = reactive({})
const defaultCodeRef = ref() // Ref for the code editor component
const questionLanguages = ref([]) // <-- 新增 ref 来存储 languages 数组

let questionId = useRoute().query.questionId
let contestId = useRoute().query.contestId
let contestTitle = useRoute().query.contestTitle
let contestEndTime = useRoute().query.contestEndTime

console.log('Route Query:', useRoute().query); // Debugging route params

async function getQuestionDetail() {
  // console.log('Current contestId:', contestId, 'Current questionId:', questionId)
  let effectiveQuestionId = questionId; // Use a local variable to manage ID fetching
  if (contestId && (effectiveQuestionId == null || effectiveQuestionId == '')) {
    try {
        const eqrs = await getContestFirstQuestionService(contestId);
        if (eqrs.code === 1000 && eqrs.data) {
            effectiveQuestionId = eqrs.data;
            // console.log('Fetched first contest questionId:', effectiveQuestionId);
             // Update route if needed, or manage state locally
            // router.replace({ query: { ...useRoute().query, questionId: effectiveQuestionId } }) // Option: update route
            questionId = effectiveQuestionId; // Update the reactive questionId if needed elsewhere
        } else {
            ElMessage.error(eqrs.msg || '获取竞赛首题ID失败');
            return; // Stop if we can't get the first question ID
        }
    } catch(error) {
        ElMessage.error('请求竞赛首题ID时出错');
        console.error("Error fetching first contest question ID:", error);
        return;
    }
  }

  if (!effectiveQuestionId) {
      ElMessage.warning('没有有效的题目ID');
      return; // Stop if no valid ID
  }

  try {
    const res = await getQuestionDetailService(effectiveQuestionId);
    // console.log('API Response for getQuestionDetailService:', res); // Debug API response
    if (res.code === 1000 && res.data) {
      Object.assign(questionDetail, res.data); // Update question details
       // Make sure 'languages' exists and is an array
      questionLanguages.value = Array.isArray(res.data.languages) ? res.data.languages : [];
      // console.log('Updated questionLanguages:', questionLanguages.value);

      // --- 不再需要下面这行 ---
      // defaultCodeRef.value.setAceCode(questionDetail.defaultCode)
    } else {
      ElMessage.error(res.msg || '获取题目详情失败');
      questionLanguages.value = []; // Clear languages on failure
      Object.keys(questionDetail).forEach(key => delete questionDetail[key]); // Clear details on failure
    }
  } catch (error) {
    ElMessage.error('请求题目详情时发生错误');
    console.error("Error fetching question detail:", error);
    questionLanguages.value = []; // Clear languages on error
    Object.keys(questionDetail).forEach(key => delete questionDetail[key]); // Clear details on error
  }
}

// Initial load call
getQuestionDetail();

// Helper function to switch question and reload details
async function switchQuestion(fetchNewIdFunc) {
    try {
        const res = await fetchNewIdFunc();
        if (res.code === 1000 && res.data) {
            questionId = res.data; // Update the current questionId
             // Optionally update route query parameter
            // router.push({ query: { ...useRoute().query, questionId: questionId } });
            await getQuestionDetail(); // Reload details for the new question
        } else {
            ElMessage.error(res.msg || '切换题目失败');
        }
    } catch (error) {
        ElMessage.error('切换题目时发生错误');
        console.error("Error switching question:", error);
    }
}

async function preQuestion() {
    if (contestId) {
        await switchQuestion(() => contestPreviousQuestionService(contestId, questionId));
    } else {
        await switchQuestion(() => previousQuestionService(questionId));
    }
}

async function nextQuestion() {
     if (contestId) {
        await switchQuestion(() => examNextQuestionService(contestId, questionId));
    } else {
        await switchQuestion(() => nextQuestionService(questionId));
    }
}


function handleCountdownFinish() {
  ElMessage.info('竞赛已经结束了哦');
  router.push('/c-oj/home/exam');
}

const submitDTO = reactive({
  examId: contestId || '', // Initialize with contestId if present
  questionId: '', // Will be updated before submit
  programType: 0, // Default to Java (Assuming 0=Java, need mapping)
  userCode: ''
});

function handleEditorContent(content) {
  // console.log('Received updated code from editor:', content);
  submitDTO.userCode = content;
}

// --- Result Handling ---
const userQuestionResultVO = ref({
  pass: 2, // 0: Fail, 1: Pass, 2: Not Run Yet, 3: Running
  exeMessage: '',
  userExeResultList: [],
});

const pollingInterval = ref(null);
let currentTime = null; // Initialize currentTime

function startPolling() {
  stopPolling(); // Ensure no duplicate intervals
  // console.log('Starting polling for result...');
  currentTime = new Date().toISOString(); // Record submit time in ISO format for consistency
  userQuestionResultVO.value.pass = 3; // Set status to 'Running'
  userQuestionResultVO.value.exeMessage = ''; // Clear previous messages
  userQuestionResultVO.value.userExeResultList = []; // Clear previous results

  pollingInterval.value = setInterval(async () => { // Make interval callback async
    // console.log('Polling...');
    await getQuestionResult();
  }, 3000); // Poll every 3 seconds (adjust as needed)

   // Add a timeout for polling to prevent infinite loops
   setTimeout(() => {
        if (userQuestionResultVO.value.pass === 3) {
            stopPolling();
            ElMessage.warning('获取结果超时，请稍后手动查询或重新提交。');
            userQuestionResultVO.value.pass = 2; // Reset status
        }
    }, 60000); // Timeout after 60 seconds
}

function stopPolling() {
  if (pollingInterval.value) {
    // console.log('Stopping polling.');
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
}

async function submitQuestion() {
  if (!submitDTO.userCode) {
      ElMessage.warning('代码不能为空！');
      return;
  }
  submitDTO.questionId = questionId; // Ensure the current questionId is set
  submitDTO.examId = contestId || null; // Set examId, use null if not in contest

  // TODO: Update submitDTO.programType based on selected language in CodeEditor
  // This requires CodeEditor to emit the selected language ID or type.
  // For now, assuming 0 (Java). You need to implement this communication.
  // Example: Add @update:language="handleLanguageUpdate" to <codeEditor>
  // function handleLanguageUpdate(langId) { submitDTO.programType = mapLanguageIdToProgramType(langId); }

  try {
    // console.log('Submitting code:', submitDTO);
    await userSubmitService(submitDTO);
    ElMessage.success('代码提交成功，正在判题...');
    startPolling(); // Start polling for results
  } catch (error) {
    ElMessage.error('代码提交失败');
    console.error("Error submitting code:", error);
     userQuestionResultVO.value.pass = 2; // Reset status on submission failure
  }
}

async function getQuestionResult() {
  if (!currentTime || !questionId) {
      // console.log('Polling skipped: currentTime or questionId missing.');
      stopPolling();
      return;
  }
  try {
    const res = await getQuestionResultService(submitDTO.examId, questionId, currentTime);
    // console.log('Polling result:', res);
    if (res.code === 1000 && res.data) {
      userQuestionResultVO.value = { ...res.data, pass: res.data.pass ?? 2 }; // Update result, default pass to 2 if null

      // Status codes: 0=Fail, 1=Pass, 3=Running
      if (userQuestionResultVO.value.pass === 0 || userQuestionResultVO.value.pass === 1) {
        // console.log('Received final result, stopping polling.');
        stopPolling(); // Stop polling if final result received
      }
    } else if (res.code !== 1000) {
         // Handle API errors during polling, maybe stop polling
         console.warn('Polling error:', res.msg);
         // Optionally stop polling on error: stopPolling();
    }
     // If status is still 3 (Running), the interval will continue
  } catch (error) {
    console.error("Error getting question result:", error);
    stopPolling(); // Stop polling on network/request error
    // Maybe set status to error? userQuestionResultVO.value.pass = -1; // Example error status
  }
}

// Clean up polling on component unmount
import { onBeforeUnmount } from 'vue';
onBeforeUnmount(() => {
  stopPolling();
});

</script>

<style lang="scss" scoped>
/* 你的所有 SCSS 样式保持不变 */
.praticle-page {
  margin-top: -40px;

  .box_1 {
    background-color: rgba(240, 240, 240, 1);
    height: 60px;
    display: flex;
    align-items: center;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;

    /* 垂直居中 */

    .box_1 span {
      margin-right: 10px;
      /* 文字与图片之间的间距 */
    }

    .exam-time-countdown {
      margin: 0 0 0 400px;
    }

    .group_1 {
      display: flex;
      align-items: center;

      img {
        margin-right: 10px;
      }
    }

    .thumbnail_1 {
      width: 1px;
      height: 20px;
      margin: 20px 0 0 8px;
    }

    .label_4 {
      width: 26px;
      height: 26px;
    }

    .group_2 {}

    .group_3 {
      cursor: pointer;
      background-color: rgba(7, 126, 255, 0.1);
      border-radius: 0px 6px 6px 0px;
      width: 100px;
      height: 40px;
      margin: 10px 0 0 2px;
      font-size: 20px;

      display: flex;
      justify-content: center;
      align-items: center;
    }

    .ide-back {
      cursor: pointer;
      color: #999999;
    }

    .label_2 {
      width: 30px;
      height: 30px;
      margin: 15px 0 0 500px;
    }

    .label_3 {
      width: 30px;
      height: 30px;
      margin: 15px 70px 0 30px;
    }
  }
}

.page {
  background-color: rgba(247, 247, 247, 1);
  position: relative;
  height: 97vh;
  overflow: hidden;

  .box_8 {
    position: relative;
    width: 100%;
    height: 1451px; // Consider using flex grow or viewport units instead of fixed height
    margin-bottom: 1px;

    .group_12 {
      width: 100%;
      height: 64px;
      margin-top: 10px;

      .image-wrapper_1 {
        background-color: rgba(240, 240, 240, 1);
        border-radius: 10px 10px 0px 0px;
        height: 64px;
        width: 600px;
        margin: 0 10px 10px 0;

        display: flex;
        align-items: center;
        /* 垂直居中 */

        .thumbnail_2 {
          width: 14px;
          height: 15px;
          margin: 0 10px 0 19px;
        }

        .question-nav {
          cursor: pointer;
          margin-right: 100px;
          display: flex;
          align-items: center;
          gap: 4px; /* Add gap for icon and text */
        }
      }

      .image-wrapper_2 {
        background-color: rgba(240, 240, 240, 1);
        border-radius: 10px 10px 0px 0px;
        height: 64px;
        display: flex;
        align-items: center;
        flex: 1;
        /* 垂直居中 */

        .image_1 {
          width: 21px;
          height: 16px;
          margin: 0 10px 0 19px;
        }
      }
    }

    .group_13 {
      height: calc(100% - 64px - 10px); // Adjust height based on container
      display: flex; // Use flex for layout

      .box_3 {
        background-color: rgba(255, 255, 255, 1);
        border-radius: 10px;
        height: 100%; // Fit container height
        width: 600px;
        margin-right: 10px;
        padding: 20px; // Add padding
        overflow-y: auto; // Allow scrolling for content

        .question-title {
          font-weight: bold;
          font-size: 24px; // Adjust font size
          margin-bottom: 10px;
        }

        .question-limit {
          font-size: 14px; // Adjust font size
          color: #abaeac;
          margin-bottom: 15px;
           > div { margin-bottom: 5px; }
        }

        .question-content {
          font-size: 16px; // Adjust font size
          line-height: 1.6;
           /* Style specific elements within v-html if needed */
           :deep(pre) { // Example: Styling code blocks within content
              background-color: #f5f5f5;
              padding: 10px;
              border-radius: 4px;
              overflow-x: auto;
            }
            :deep(code) {
               font-family: monospace;
            }
        }

        // Remove fixed height scrollbar elements (group_6, etc.) if using native scroll
      }

      .group_14 {
        height: 100%; // Fit container height
        display: flex;
        flex-direction: column; // Stack editor and results vertically
        flex: 1; // Take remaining width

        .group_8 {
          background-color: rgba(255, 255, 255, 1);
          border-radius: 10px;
          flex: 1; // Let editor take available space initially
          display: flex; // Use flex for internal layout if needed
          flex-direction: column; // Ensure children stack
          min-height: 400px; // Minimum height for the editor area
           overflow: hidden; // Prevent ACE editor overflow issues
        }

        .code-result {
          background-color: rgba(240, 240, 240, 1);
          border-radius: 10px 10px 0px 0px;
          height: 64px;
          margin-top: 10px; // Space between editor and results header
          // width: 100%; // Take full width
          display: flex;
          align-items: center;
          padding: 0 20px;


          .code-result-image {
            width: 22px; // Adjust size
            height: 22px;
            margin-right: 8px;
          }

          .code-result-content {
             font-size: 16px;
             font-weight: 500;
          }
        }
        .group_15 {
            // width: 100%; // Take full width
            // height: 250px; // Fixed height for result area, adjust as needed
            flex-shrink: 0; // Prevent shrinking
            overflow: hidden; // Hide overflow initially

             .section_1 {
                background-color: rgba(255, 255, 255, 1);
                border-radius: 0px 0px 10px 10px;
                width: 100%;
                height: 100%; // Take full height of group_15
                padding: 15px 20px; // Add padding
                overflow-y: auto; // Allow scrolling for results

                .section_3 {
                   width: 100%;
                   height: auto; // Adjust height based on content
                   margin: 0; // Remove margin

                  .error-text {
                    padding: 8px 12px;
                    font-size: 14px;
                    color: #d32f2f; // Error color
                    background: #ffebee; // Light red background
                    border-left: 3px solid #d32f2f;
                    margin-top: 10px;
                    margin-bottom: 10px;
                    white-space: pre-wrap; // Preserve whitespace/newlines
                    word-break: break-all; // Break long messages
                    width: auto; // Adjust width
                  }

                  .text-wrapper_2 {
                    width: auto; // Adjust width
                    height: auto; // Adjust height
                    margin-bottom: 10px; // Space below status

                    .text_1 {
                       width: auto; // Adjust width
                       height: auto; // Adjust height
                       font-size: 16px; // Adjust font size
                       font-weight: bold;
                       line-height: 1.5; // Adjust line height
                       padding: 2px 8px; // Add padding
                       border-radius: 4px; // Rounded corners

                      &.red { color: #fff; background-color: #f44336; } // Fail
                      &.info { color: #fff; background-color: #2196F3; } // Running
                      &.success { color: #fff; background-color: #4CAF50; } // Pass
                      &.warning { color: #212121; background-color: #FFC107; } // Not Run Yet
                    }
                  }
                   /* Style el-table */
                   .el-table {
                       margin-top: 10px;
                   }
                }
             }
        }
      }
    }
  }
}

/* Add styles for el-icon alignment if needed */
.el-icon {
  vertical-align: middle;
  margin-right: 4px; /* Adjust spacing */
}
.question-nav .el-icon span {
     vertical-align: middle;
}
</style>