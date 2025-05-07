import { useState } from "react";
import { nanoid } from "nanoid";
import { ActionPanel, Icon, List, Action } from "@raycast/api";
import { useLocalStorage } from "@raycast/utils";
import { Prompt } from "./types";
import { CreatePromptAction, DeletePromptAction, EmptyView, TogglePromptAction } from "./components";

type State = {
  searchText: string;
};

export default function Command() {
  const [state, setState] = useState<State>({
    searchText: "",
  });
  const { value: prompts, setValue: setPrompts, isLoading } = useLocalStorage<Prompt[]>("prompts");

  const handleCreate = (values: { title: string; content: string; tags: string; enabled: boolean }) => {
    setPrompts([
      ...(prompts ?? []),
      {
        id: nanoid(),
        title: values.title,
        content: values.content,
        tags: values.tags.split(","),
        enabled: values.enabled,
      },
    ]);
    setState((previous) => ({
      ...previous,
      searchText: "",
    }));
  };

  // 只展示启用的 prompt
  const filteredPrompts = (() => {
    return prompts?.filter((prompt) => prompt.enabled) ?? [];
  })();

  return (
    <List
      isLoading={isLoading}
      searchText={state.searchText}
      filtering
      onSearchTextChange={(newValue) => {
        setState((previous) => ({ ...previous, searchText: newValue }));
      }}
      isShowingDetail={filteredPrompts.length > 0}
    >
      <EmptyView prompts={filteredPrompts} searchText={state.searchText} onCreate={handleCreate} />
      {filteredPrompts.map((prompt, index) => (
        <List.Item
          key={prompt.id}
          icon={Icon.Snippets}
          title={prompt.title}
          actions={
            <ActionPanel>
              <ActionPanel.Section>
                <Action.Paste content={prompt.content} title="Paste Prompt" />
                <Action.CopyToClipboard content={prompt.content} />
              </ActionPanel.Section>
              <ActionPanel.Section>
                <TogglePromptAction
                  prompt={prompt}
                  onToggle={() =>
                    setPrompts(
                      prompts?.map((prompt, i) => {
                        if (i === index) {
                          return { ...prompt, enabled: !prompt.enabled };
                        }
                        return prompt;
                      }) ?? [],
                    )
                  }
                />
                <CreatePromptAction defaultTitle={state.searchText} onCreate={handleCreate} />
                <DeletePromptAction onDelete={() => setPrompts(prompts?.filter((_, i) => i !== index) ?? [])} />
              </ActionPanel.Section>
            </ActionPanel>
          }
          detail={
            <List.Item.Detail
              markdown={prompt.content}
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label title="title" text={prompt.title} />
                  {prompt.tags && prompt.tags.length > 0 && (
                    <List.Item.Detail.Metadata.Label title="tags" text={prompt.tags.join(", ")} />
                  )}
                </List.Item.Detail.Metadata>
              }
            />
          }
        />
      ))}
    </List>
  );
}
