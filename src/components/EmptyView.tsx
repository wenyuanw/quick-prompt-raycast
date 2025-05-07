import { ActionPanel, List } from "@raycast/api";
import { Filter, Prompt } from "../types";
import { CreatePromptAction } from "./CreatePromptAction";

export function EmptyView(props: {
  prompts: Prompt[];
  filter?: Filter;
  searchText: string;
  onCreate: (values: { title: string; content: string; tags: string; enabled: boolean }) => void;
}) {
  const filter = props.filter ?? Filter.All;

  if (props.prompts.length > 0) {
    return (
      <List.EmptyView
        icon="😕"
        title="No matching prompts found"
        description={`Can't find a prompt matching ${props.searchText}.\nCreate it now!`}
        actions={
          <ActionPanel>
            <CreatePromptAction
              defaultTitle={props.searchText}
              onCreate={props.onCreate}
            />
          </ActionPanel>
        }
      />
    );
  }

  switch (filter) {
    case Filter.Enabled: {
      return (
        <List.EmptyView
          icon="🎉"
          title="All done"
          description="All prompts completed - way to go! Why not create some more?"
          actions={
            <ActionPanel>
              <CreatePromptAction defaultTitle={props.searchText} onCreate={props.onCreate} />
            </ActionPanel>
          }
        />
      );
    }
    case Filter.Disabled: {
      return (
        <List.EmptyView
          icon="😢"
          title="No prompts completed"
          description="Uh-oh, looks like you haven't completed any prompts yet."
        />
      );
    }
    case Filter.All:
    default: {
      return (
        <List.EmptyView
          icon="📝"
          title="No prompts found"
          description="You don't have any prompts yet. Why not add some?"
          actions={
            <ActionPanel>
              <CreatePromptAction defaultTitle={props.searchText} onCreate={props.onCreate} />
            </ActionPanel>
          }
        />
      );
    }
  }
}
