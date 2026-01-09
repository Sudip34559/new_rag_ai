"use client";

import {
  ModelSelector,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { FileText, Globe, Youtube, Github, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useChatStore } from "./store/store";

const models = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    chef: "OpenAI",
    chefSlug: "openai",
    providers: ["openai", "azure"],
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    chef: "OpenAI",
    chefSlug: "openai",
    providers: ["openai", "azure"],
  },
  {
    id: "claude-opus-4-20250514",
    name: "Claude 4 Opus",
    chef: "Anthropic",
    chefSlug: "anthropic",
    providers: ["anthropic", "azure", "google", "amazon-bedrock"],
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude 4 Sonnet",
    chef: "Anthropic",
    chefSlug: "anthropic",
    providers: ["anthropic", "azure", "google", "amazon-bedrock"],
  },
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    chef: "Google",
    chefSlug: "google",
    providers: ["google"],
  },
];

const SUBMITTING_TIMEOUT = 200;
const STREAMING_TIMEOUT = 2000;

const HomePage = () => {
  const router = useRouter();
  const [model, setModel] = useState<string>(models[0].id);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedModelData = models.find((m) => m.id === model);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    if (!hasText) {
      return;
    }
    setStatus("submitted");
    console.log("Submitting message:", message);

    useChatStore.getState().setMessage(message.text || "");
    router.push("/chat");
  };

  // const handleActionClick = (action: string) => {
  //   console.log(`${action} button clicked`);
  //   // Handle navigation or modal opening here
  // };

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Dotted Grid Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      ></div>

      {/* Content Container */}
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Welcome to AI Assistant
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Ask me anything or upload your documents for instant insights
            </p>
          </div>

          {/* Main Input Section */}
          <PromptInputProvider>
            <div className="space-y-4">
              <PromptInput globalDrop multiple onSubmit={handleSubmit}>
                <PromptInputAttachments>
                  {(attachment) => <PromptInputAttachment data={attachment} />}
                </PromptInputAttachments>
                <PromptInputBody>
                  <PromptInputTextarea
                    ref={textareaRef}
                    placeholder="Ask me anything or describe what you need help with..."
                  />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputTools>
                    <PromptInputActionMenu>
                      <PromptInputActionMenuTrigger />
                    </PromptInputActionMenu>
                    <PromptInputSpeechButton textareaRef={textareaRef} />
                    <ModelSelector
                      onOpenChange={setModelSelectorOpen}
                      open={modelSelectorOpen}
                    >
                      <ModelSelectorTrigger asChild>
                        <PromptInputButton>
                          {selectedModelData?.chefSlug && (
                            <ModelSelectorLogo
                              provider={selectedModelData.chefSlug}
                            />
                          )}
                          {selectedModelData?.name && (
                            <ModelSelectorName>
                              {selectedModelData.name}
                            </ModelSelectorName>
                          )}
                        </PromptInputButton>
                      </ModelSelectorTrigger>
                      {/* <ModelSelectorContent>
                        <ModelSelectorInput placeholder="Search models..." />
                        <ModelSelectorList>
                          <ModelSelectorEmpty>
                            No models found.
                          </ModelSelectorEmpty>
                          {["OpenAI", "Anthropic", "Google"].map((chef) => (
                            <ModelSelectorGroup heading={chef} key={chef}>
                              {models
                                .filter((m) => m.chef === chef)
                                .map((m) => (
                                  <ModelSelectorItem
                                    key={m.id}
                                    onSelect={() => {
                                      setModel(m.id);
                                      setModelSelectorOpen(false);
                                    }}
                                    value={m.id}
                                  >
                                    <ModelSelectorLogo provider={m.chefSlug} />
                                    <ModelSelectorName>
                                      {m.name}
                                    </ModelSelectorName>
                                    <ModelSelectorLogoGroup>
                                      {m.providers.map((provider) => (
                                        <ModelSelectorLogo
                                          key={provider}
                                          provider={provider}
                                        />
                                      ))}
                                    </ModelSelectorLogoGroup>
                                    {model === m.id ? (
                                      <CheckIcon className="ml-auto size-4" />
                                    ) : (
                                      <div className="ml-auto size-4" />
                                    )}
                                  </ModelSelectorItem>
                                ))}
                            </ModelSelectorGroup>
                          ))}
                        </ModelSelectorList>
                      </ModelSelectorContent> */}
                    </ModelSelector>
                  </PromptInputTools>
                  <PromptInputSubmit status={status} />
                </PromptInputFooter>
              </PromptInput>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button variant="outline" size="lg" className="gap-2">
                  <Link
                    href={"/chat/pdf-doc"}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                  <Link
                    href={"/chat/web-page"}
                    className="flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">Web</span>
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                  <Link
                    href={"/chat/youtube-video"}
                    className="flex items-center gap-2"
                  >
                    <Youtube className="w-4 h-4" />
                    <span className="hidden sm:inline">YouTube</span>
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                  <Link
                    href={"/chat/github-repo"}
                    className="flex items-center gap-2"
                  >
                    <Github className="w-4 h-4" />
                    <span className="hidden sm:inline">GitHub</span>
                  </Link>
                </Button>
              </div>

              {/* Helper Text */}
              <p className="text-center text-xs text-muted-foreground pt-2">
                Upload documents or connect data sources to enhance your
                conversations
              </p>
            </div>
          </PromptInputProvider>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
