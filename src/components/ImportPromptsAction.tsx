import { Action, Toast, showToast, Form, ActionPanel, useNavigation } from "@raycast/api";
import { Prompt } from "../types";
import * as fs from "fs/promises";
import { useState } from "react";
import fetch from "node-fetch";

interface ImportPromptsActionProps {
  onImport: (prompts: Prompt[]) => void;
  currentPrompts?: Prompt[]; // 添加当前提示词列表参数
}

// 处理合并提示词数据的通用函数
function mergePrompts(importedPrompts: Prompt[], currentPrompts: Prompt[] = []): { mergedPrompts: Prompt[], stats: { added: number, updated: number } } {
  // 处理导入的数据
  const stats = {
    added: 0,
    updated: 0
  };
  
  // 合并数据：新数据将覆盖同ID的旧数据，不同ID的数据将被添加
  const mergedPrompts = [...currentPrompts]; // 复制当前提示词列表
  
  importedPrompts.forEach(importedPrompt => {
    const existingIndex = mergedPrompts.findIndex(p => p.id === importedPrompt.id);
    
    if (existingIndex >= 0) {
      // 更新现有项
      mergedPrompts[existingIndex] = importedPrompt;
      stats.updated++;
    } else {
      // 添加新项
      mergedPrompts.push(importedPrompt);
      stats.added++;
    }
  });

  return { mergedPrompts, stats };
}

// 导入表单组件
function ImportForm({ onImport, currentPrompts = [] }: ImportPromptsActionProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [urlError, setUrlError] = useState<string | undefined>();
  const [importMethod, setImportMethod] = useState<"file" | "url">("file");
  
  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  const handleImport = async (values: { filePath?: string[], url?: string }) => {
    const { filePath, url } = values;
    
    // 验证输入
    if (importMethod === "file" && (!filePath || filePath.length === 0)) {
      await showToast({
        style: Toast.Style.Failure,
        title: "导入失败",
        message: "请选择文件",
      });
      return;
    }
    
    if (importMethod === "url") {
      if (!url) {
        setUrlError("请输入URL");
        return;
      }
      
      if (!validateUrl(url)) {
        setUrlError("请输入有效的URL");
        return;
      }
    }
    
    setIsImporting(true);

    try {
      let importedPrompts: Prompt[];
      
      // 根据选择的方式导入数据
      if (importMethod === "file" && filePath && filePath.length > 0) {
        // 从文件导入
        const fileContent = await fs.readFile(filePath[0], "utf-8");
        importedPrompts = JSON.parse(fileContent) as Prompt[];
      } else if (importMethod === "url" && url) {
        // 从URL导入
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`服务器返回错误: ${response.status} ${response.statusText}`);
        }
        
        importedPrompts = await response.json() as Prompt[];
      } else {
        throw new Error("没有选择导入方式");
      }
      
      if (!Array.isArray(importedPrompts) || !importedPrompts.every(isValidPrompt)) {
        throw new Error("无效的提示词数据格式");
      }
      
      // 使用通用合并函数处理数据
      const { mergedPrompts, stats } = mergePrompts(importedPrompts, currentPrompts);

      // 将合并后的数据传递给onImport
      onImport(mergedPrompts);
      
      await showToast({
        style: Toast.Style.Success,
        title: "导入成功",
        message: `已导入 ${importedPrompts.length} 条提示词 (新增: ${stats.added}, 更新: ${stats.updated})`,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "导入失败",
        message: String(error),
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Form 
      navigationTitle="导入提示词"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="导入" onSubmit={handleImport} />
        </ActionPanel>
      }
      isLoading={isImporting}
    >
      <Form.Description 
        title="导入说明" 
        text="请选择从本地文件导入或从远程URL导入提示词数据。导入时会合并数据：ID相同的提示词将被更新，ID不同的提示词将被添加。" 
      />
      <Form.Dropdown 
        id="importMethod" 
        title="导入方式" 
        value={importMethod} 
        onChange={(newValue) => setImportMethod(newValue as "file" | "url")}
      >
        <Form.Dropdown.Item value="file" title="从文件导入" />
        <Form.Dropdown.Item value="url" title="从URL导入" />
      </Form.Dropdown>
      
      {importMethod === "file" && (
        <Form.FilePicker 
          id="filePath" 
          title="选择文件" 
          allowMultipleSelection={false} 
          canChooseDirectories={false}
        />
      )}
      
      {importMethod === "url" && (
        <Form.TextField 
          id="url" 
          title="URL地址" 
          placeholder="https://example.com/prompts.json"
          error={urlError}
          onChange={() => setUrlError(undefined)}
        />
      )}
    </Form>
  );
}

// 主导入按钮组件
export function ImportPromptsAction({ onImport, currentPrompts }: ImportPromptsActionProps) {
  const { push } = useNavigation();
  
  const handleOpenImportForm = () => {
    push(<ImportForm onImport={onImport} currentPrompts={currentPrompts} />);
  };

  return <Action title="导入提示词" icon="📥" onAction={handleOpenImportForm} />;
}

// 验证提示词数据是否有效
function isValidPrompt(obj: any): obj is Prompt {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.id === "string" &&
    typeof obj.title === "string" &&
    typeof obj.content === "string" &&
    typeof obj.enabled === "boolean" &&
    (obj.tags === undefined || Array.isArray(obj.tags))
  );
} 