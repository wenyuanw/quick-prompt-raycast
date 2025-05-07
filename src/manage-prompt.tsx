import { useState } from "react";
import { nanoid } from "nanoid";
import { ActionPanel, Icon, List, Action } from "@raycast/api";
import { useLocalStorage } from "@raycast/utils";
import { Filter, Prompt } from "./types";
import { CreatePromptAction, DeletePromptAction, EmptyView, TogglePromptAction } from "./components";
import { EditPromptAction } from "./components/EditPromptAction";

type State = {
  filter: Filter;
  searchText: string;
};

export default function Command() {
  const [state, setState] = useState<State>({
    filter: Filter.All,
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
      filter: Filter.All,
      searchText: "",
    }));
  };

  const handleEdit = (prompt: Prompt) => {
    setPrompts(
      prompts?.map((p) =>
        p.id === prompt.id
          ? { ...p, title: prompt.title, content: prompt.content, enabled: prompt.enabled, tags: prompt.tags }
          : p,
      ) ?? [],
    );
  };

  const filteredPrompts = (() => {
    if (state.filter === Filter.Enabled) {
      return prompts?.filter((prompt) => prompt.enabled) ?? [];
    }
    if (state.filter === Filter.Disabled) {
      return prompts?.filter((prompt) => !prompt.enabled) ?? [];
    }
    return prompts ?? [];
  })();

  return (
    <List
      isLoading={isLoading}
      searchText={state.searchText}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Prompt List"
          value={state.filter}
          onChange={(newValue) => setState((previous) => ({ ...previous, filter: newValue as Filter }))}
        >
          <List.Dropdown.Item title="All" value={Filter.All} icon={Icon.CircleDisabled} />
          <List.Dropdown.Item title="Enabled" value={Filter.Enabled} icon={Icon.Eye} />
          <List.Dropdown.Item title="Disabled" value={Filter.Disabled} icon={Icon.EyeDisabled} />
        </List.Dropdown>
      }
      filtering
      onSearchTextChange={(newValue) => {
        setState((previous) => ({ ...previous, searchText: newValue }));
      }}
      isShowingDetail={filteredPrompts.length > 0}
    >
      <EmptyView
        filter={state.filter}
        prompts={filteredPrompts}
        searchText={state.searchText}
        onCreate={handleCreate}
      />
      {filteredPrompts.map((prompt, index) => (
        <List.Item
          key={prompt.id}
          icon={Icon.Snippets}
          title={prompt.title}
          detail={
            <List.Item.Detail
              markdown={prompt.content}
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label title="title" text={prompt.title} />
                  {prompt.tags?.length && prompt.tags?.length > 0 && (
                    <List.Item.Detail.Metadata.Label title="tags" text={prompt.tags.join(", ")} />
                  )}
                  <List.Item.Detail.Metadata.Label
                    title="status"
                    icon={prompt.enabled ? Icon.Eye : Icon.EyeDisabled}
                    text={prompt.enabled ? "Enabled" : "Disabled"}
                  />
                </List.Item.Detail.Metadata>
              }
            />
          }
          actions={
            <ActionPanel>
              <ActionPanel.Section>
                <CreatePromptAction defaultTitle={state.searchText} onCreate={handleCreate} />
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
                <EditPromptAction prompt={prompt} onEdit={handleEdit} />
                <DeletePromptAction onDelete={() => setPrompts(prompts?.filter((_, i) => i !== index) ?? [])} />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
