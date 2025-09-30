"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useAppDispatch,
  LANGUAGE_OPTIONS,
  useAppSelector,
  GRAPH_OPTIONS,
  GROUPED_GRAPH_OPTIONS,
} from "@/common"
import {
  ChainedAIIcon,
  MultimodalIcon,
  SpeechToSpeechIcon,
  PlatformIntegrationIcon,
  SpecializedAgentIcon,
  OpenAIIcon,
  GeminiIcon,
  AzureIcon,
  MetaIcon,
  NovaIcon,
  DeepSeekIcon,
  XAIIcon,
  QwenIcon,
  DifyIcon,
  CozeIcon,
  OceanBaseIcon,
} from "@/components/Icon"
import type { Language } from "@/types"
import { setGraphName, setLanguage } from "@/store/reducers/global"

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Chained Voice AI":
      return ChainedAIIcon
    case "Multimodal Voice AI":
      return MultimodalIcon
    case "Speech to Speech Voice AI":
      return SpeechToSpeechIcon
    case "AI Platform Integrations":
      return PlatformIntegrationIcon
    case "Specialized Agents":
      return SpecializedAgentIcon
    default:
      return ChainedAIIcon
  }
}

const getBrandIcon = (label: string) => {
  if (label.includes("OpenAI")) return OpenAIIcon
  if (label.includes("Gemini")) return GeminiIcon
  if (label.includes("Azure")) return AzureIcon
  if (label.includes("Llama")) return MetaIcon
  if (label.includes("Nova")) return NovaIcon
  if (label.includes("DeepSeek")) return DeepSeekIcon
  if (label.includes("Grok")) return XAIIcon
  if (label.includes("Qwen") || label.includes("QwQ")) return QwenIcon
  if (label.includes("Dify")) return DifyIcon
  if (label.includes("Coze")) return CozeIcon
  if (label.includes("OceanBase")) return OceanBaseIcon
  // Default fallback
  return () => <span className="w-3 h-3 rounded-full bg-current opacity-50" />
}

export function GraphSelect() {
  const dispatch = useAppDispatch()
  const graphName = useAppSelector((state) => state.global.graphName)
  const agentConnected = useAppSelector((state) => state.global.agentConnected)
  const onGraphNameChange = (val: string) => {
    dispatch(setGraphName(val))
  }

  return (
    <>
      <Select
        value={graphName}
        onValueChange={onGraphNameChange}
        disabled={agentConnected}
      >
        <SelectTrigger className="w-auto max-w-full">
          <SelectValue placeholder="Graph" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(GROUPED_GRAPH_OPTIONS).map(([category, options]) => {
            const CategoryIcon = getCategoryIcon(category)
            return (
              <SelectGroup key={category}>
                <SelectLabel className="text-base font-bold text-foreground px-2 py-2 flex items-center gap-2">
                  <CategoryIcon className="h-4 w-4" />
                  {category}
                </SelectLabel>
                {options.map((item) => {
                  const BrandIcon = getBrandIcon(item.label)
                  return (
                    <SelectItem value={item.value} key={item.value} className="pl-8">
                      <span className="flex items-center gap-2">
                        <BrandIcon className="w-4 h-4 flex-shrink-0" />
                        {item.label}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectGroup>
            )
          })}
        </SelectContent>
      </Select>
    </>
  )
}

export function LanguageSelect() {
  const dispatch = useAppDispatch()
  const language = useAppSelector((state) => state.global.language)
  const agentConnected = useAppSelector((state) => state.global.agentConnected)

  const onLanguageChange = (val: Language) => {
    dispatch(setLanguage(val))
  }

  return (
    <>
      <Select
        value={language}
        onValueChange={onLanguageChange}
        disabled={agentConnected}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_OPTIONS.map((item) => {
            return (
              <SelectItem value={item.value} key={item.value}>
                {item.label}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </>
  )
}
