<template>
  <el-select
    v-model="selectedLanguageId"
    placeholder="选择语言"
    style="width: 120px; margin-bottom: 5px;"
    @change="onLanguageChange"
    size="small"
  >
    <el-option
      v-for="item in languageChoices"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    />
  </el-select>
  <div ref="editorform" class="ace-editor">
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineProps, watch, computed } from "vue";
import ace from "ace-builds";

// --- 按需导入 Ace Editor 的 Mode、Theme 和 Extensions ---
// Base
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/theme-eclipse"; // 使用的主题

// Modes (根据 languageModeMap 添加)
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-golang";
import "ace-builds/src-noconflict/mode-sql";
// -------------------------------------------------------

// 1. 定义 Props，接收父组件传递的 languageOptions
const props = defineProps({
  languageOptions: {
    type: Array,
    default: () => [] // 默认空数组
  }
});

// 2. 语言 ID 到用户可读名称的映射 (需要根据后端 languageId 实际情况配置)
const languageNameMap = {
  1: 'Java',
  2: 'Python',
  // 3: 'JavaScript',
  // 4: 'C++',
  // 5: 'Go',
  // 6: 'SQL',
  // ... 其他语言
};

// 3. 语言 ID 到 Ace Editor Mode 名称的映射 (确保导入了对应的 mode 文件)
const languageModeMap = {
    1: 'java',
    2: 'python',
    3: 'javascript',
    4: 'c_cpp',
    5: 'golang',
    // 6: 'sql',
    // ...
};

// 4. 定义响应式引用
const selectedLanguageId = ref(null); // 当前选中的语言 ID
const editorform = ref(null); // Ace Editor 的 DOM 容器 ref
let editor = null; // Ace Editor 实例
const emit = defineEmits(['update:value', 'update:language']); // 添加 update:language 事件

// 5. Computed Property: 生成 el-select 的选项列表
const languageChoices = computed(() => {
  return props.languageOptions.map(lang => ({
    id: lang.languageId,
    name: languageNameMap[lang.languageId] || `未知语言 (ID: ${lang.languageId})` // 提供备用名称
  })).sort((a, b) => (a.name > b.name ? 1 : -1)); // 按名称排序
});

// 6. Ace Editor 初始化选项
const editorOptions = {
  theme: `ace/theme/eclipse`, // 主题
  mode: `ace/mode/text`, // 初始默认模式，稍后会动态设置
  maxLines: 40,           // 最大行数
  minLines: 20,           // 最小行数 (可以调整)
  fontSize: 14,           // 字体大小
  tabSize: 4,             // Tab 宽度
  useSoftTabs: true,      // 使用空格替代 Tab
  highlightActiveLine: true, // 高亮当前行
  enableBasicAutocompletion: true, // 启用基本自动完成
  enableLiveAutocompletion: true,  // 启用实时自动完成
  enableSnippets: true,           // 启用代码片段
  showPrintMargin: false,        // 不显示打印边界
  wrap: true                     // 自动换行
};

// 7. 更新编辑器内容和模式的函数
function updateEditorContent(languageId) {
  if (!editor || languageId === null) return; // Guard: 编辑器未就绪或未选择语言

  const selectedLang = props.languageOptions.find(lang => lang.languageId === languageId);

  if (selectedLang) {
    const defaultCode = selectedLang.defaultCode || '';
    editor.setValue(defaultCode, -1); // 设置内容，并将光标移到开头

    // 动态设置语言模式
    const mode = languageModeMap[languageId];
    if (mode) {
      editor.getSession().setMode(`ace/mode/${mode}`);
    } else {
      console.warn(`未找到 Language ID ${languageId} 对应的 Ace Editor Mode，将使用 text 模式。`);
      editor.getSession().setMode(`ace/mode/text`); // 回退到纯文本模式
    }

    // 触发事件，将当前代码和选中的语言ID传回父组件
    emit('update:value', defaultCode);
    emit('update:language', languageId); // <-- 发送选中的语言 ID
  } else {
    editor.setValue(''); // 如果找不到语言，清空编辑器
    editor.getSession().setMode(`ace/mode/text`);
    emit('update:value', '');
    emit('update:language', null); // <-- 发送 null
  }
}

// 8. el-select 的 @change 事件处理器
function onLanguageChange(newId) {
    updateEditorContent(newId);
}

// 9. Watcher: 监听 props.languageOptions 的变化
watch(() => props.languageOptions, (newOptions) => {
  if (newOptions && newOptions.length > 0) {
    const currentSelectionValid = newOptions.some(opt => opt.languageId === selectedLanguageId.value);
    // 如果没有选中语言，或当前选中的语言在新列表中无效，则默认选中第一个
    if (selectedLanguageId.value === null || !currentSelectionValid) {
      selectedLanguageId.value = newOptions[0].languageId;
       // 如果编辑器已就绪，立即更新；否则等待 onMounted 中的调用
      if (editor) {
        updateEditorContent(selectedLanguageId.value);
      }
    }
  } else {
    // 如果选项变为空
    selectedLanguageId.value = null;
    if (editor) {
      editor.setValue('');
      editor.getSession().setMode(`ace/mode/text`);
      emit('update:value', '');
      emit('update:language', null);
    }
  }
}, { deep: true, immediate: true }); // immediate 确保初始加载时执行一次

// 10. onMounted: 初始化 Ace Editor
onMounted(() => {
  editor = ace.edit(editorform.value, editorOptions);

  // 监听编辑器内容变化，实时同步到父组件
  editor.getSession().on('change', () => {
    emit('update:value', editor.getValue());
  });

  // 组件挂载后，如果此时已有选中的语言ID，则触发一次内容更新
  // （确保 watcher 设置了 initial ID 后，这里能正确加载初始代码和模式）
  if (selectedLanguageId.value !== null) {
    updateEditorContent(selectedLanguageId.value);
  }
});

// 11. onBeforeUnmount: 销毁编辑器实例，防止内存泄漏
onBeforeUnmount(() => {
  if (editor) {
    editor.destroy();
    editor = null;
  }
});

// 12. (可选) 保留 setAceCode 方法，如果父组件确实需要强制覆盖编辑器内容
function setAceCode(content) {
  if (editor) {
    editor.setValue(content || '', -1);
  } else {
    console.warn("调用 setAceCode 时 Ace 编辑器尚未初始化。");
  }
}

// 暴露需要从父组件访问的方法 (如果需要)
defineExpose({
  setAceCode
});

</script>

<style lang="scss" scoped>
.ace-editor {
  // height: 500px; /* 使用 flex grow 后，可以不固定高度 */
  min-height: 300px; /* 保证最小高度 */
  width: 100%;     /* 宽度占满容器 */
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  flex-grow: 1; /* 在 flex 布局中自动伸展 */
}

/* 确保 el-select 和 editor 容器在垂直方向上排列 */
:host {
  display: flex;
  flex-direction: column;
  height: 100%; /* 占满父容器 .group_8 的高度 */
}
</style>