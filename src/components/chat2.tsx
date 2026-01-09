"use client";

import {
  MessageBranch,
  MessageBranchContent,
} from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Shimmer } from "./ai-elements/shimmer";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, ToolUIPart } from "ai";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./ai-elements/tool";
import { CodeBlock } from "./ai-elements/code-block";

const Chat = ({ userQuery }: { userQuery: string }) => {
  const [text, setText] = useState<string>(userQuery || "");
  const initialMessageSent = useRef(false);

  const { messages, status, sendMessage, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    if (message.files?.length) {
      toast.success("Files attached", {
        description: `${message.files.length} file(s) attached to message`,
      });
    }

    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files || [],
      },
      {}
    );

    setText("");
  };

  useEffect(() => {
    if (userQuery && !initialMessageSent.current) {
      initialMessageSent.current = true;
      sendMessage(
        {
          text: userQuery,
          files: [],
        },
        {}
      );
    }
  }, [userQuery, sendMessage]);

  //   const handleSuggestionClick = (suggestion: string) => {
  //     sendMessage(
  //       {
  //         text: suggestion,
  //       },
  //       {
  //         body: {
  //           collectionName: type,
  //         },
  //       }
  //     );
  //   };

  return (
    <div className="relative flex size-full flex-col divide-y overflow-hidden">
      <Conversation>
        <ConversationContent>
          {messages.map((message) => {
            return (
              <MessageBranch defaultBranch={0} key={message.id}>
                <MessageBranchContent>
                  <Message
                    from={message.role === "user" ? "user" : "assistant"}
                  >
                    <div>
                      {/* Sources */}
                      {message.role === "assistant" &&
                        message.parts?.filter(
                          (part) => part.type === "source-url"
                        ).length > 0 && (
                          <Sources>
                            <SourcesTrigger
                              count={
                                message.parts.filter(
                                  (part) => part.type === "source-url"
                                ).length
                              }
                            />
                            <SourcesContent>
                              {message.parts
                                .filter((part) => part.type === "source-url")
                                .map((part, i) => (
                                  <Source
                                    key={`${message.id}-source-${i}`}
                                    href={part.url}
                                    title={part.url}
                                  />
                                ))}
                            </SourcesContent>
                          </Sources>
                        )}

                      {/* Reasoning */}
                      {message.parts
                        ?.filter((part) => part.type === "reasoning")
                        .map((part, i) => (
                          <Reasoning key={`${message.id}-reasoning-${i}`}>
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        ))}

                      {/* Message Content */}
                      <MessageContent>
                        {message.parts?.map((part, i) => {
                          if (part.type === "text") {
                            return (
                              <MessageResponse key={`${message.id}-text-${i}`}>
                                {part.text}
                              </MessageResponse>
                            );
                          } else if (part.type.includes("tool-")) {
                            const tool = part as ToolUIPart;
                            return (
                              <div key={tool.toolCallId}>
                                <Tool defaultOpen={false}>
                                  <ToolHeader
                                    type={tool.type}
                                    state={tool.state}
                                  />
                                  <ToolContent>
                                    <ToolInput input={tool.input} />
                                    {tool.state === "output-available" && (
                                      <ToolOutput
                                        errorText={tool.errorText}
                                        output={
                                          <CodeBlock
                                            code={JSON.stringify(tool.output)}
                                            language="json"
                                          />
                                        }
                                      />
                                    )}

                                    {tool.state === "output-error" && (
                                      <ToolOutput
                                        errorText={tool.errorText}
                                        output={tool.output}
                                      />
                                    )}
                                  </ToolContent>
                                </Tool>
                                {tool.state === "output-available" &&
                                tool.output &&
                                typeof tool.output === "object" &&
                                "answer" in tool.output ? (
                                  <MessageResponse>
                                    {(tool.output as { answer: string }).answer}
                                  </MessageResponse>
                                ) : (
                                  ""
                                )}
                              </div>
                            );
                          }
                        })}
                        {!message.parts && (
                          <MessageResponse>{message.parts}</MessageResponse>
                        )}
                      </MessageContent>
                    </div>
                  </Message>
                </MessageBranchContent>
              </MessageBranch>
            );
          })}

          {/* Loading State */}
          {(status === "submitted" || status === "streaming") && (
            <Message from={"assistant"} key={"streaming-message"}>
              <Shimmer duration={1}>Thinking.....</Shimmer>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="grid shrink-0 gap-4 pt-4">
        {/* Suggestions can be uncommented */}
        {/* <Suggestions className="px-4">
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              suggestion={suggestion}
            />
          ))}
        </Suggestions> */}

        <div className="w-full px-4 pb-4">
          <PromptInput globalDrop multiple onSubmit={handleSubmit}>
            <PromptInputHeader>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                onChange={(event) => setText(event.target.value)}
                value={text}
                disabled={status === "streaming"}
              />
            </PromptInputBody>
            <PromptInputFooter className="justify-end">
              {status === "streaming" ? (
                <PromptInputSubmit onClick={stop} status={status} />
              ) : (
                <PromptInputSubmit
                  disabled={!text.trim() || status === "submitted"}
                  status={status}
                />
              )}
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
};

export default Chat;
