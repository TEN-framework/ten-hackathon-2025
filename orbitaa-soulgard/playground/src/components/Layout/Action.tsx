"use client";

import * as React from "react";

import { LoadingButton } from "@/components/Button/LoadingButton";
import { setAgentConnected } from "@/store/reducers/global";
import {
  useAppDispatch,
  useAppSelector,
  apiPing,
  apiStartService,
  apiStopService,
  isEditModeOn,
} from "@/common";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RemoteGraphSelect } from "@/components/Chat/ChatCfgGraphSelect";

let intervalId: NodeJS.Timeout | null = null;

export default function Action(props: { className?: string }) {
  const { className } = props;
  const dispatch = useAppDispatch();
  const agentConnected = useAppSelector((state) => state.global.agentConnected);
  const channel = useAppSelector((state) => state.global.options.channel);
  const userId = useAppSelector((state) => state.global.options.userId);
  const language = useAppSelector((state) => state.global.language);
  const voiceType = useAppSelector((state) => state.global.voiceType);
  const selectedGraphId = useAppSelector(
    (state) => state.global.selectedGraphId
  );
  const graphList = useAppSelector((state) => state.global.graphList);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (channel) {
      checkAgentConnected();
    }
  }, [channel]);

  const checkAgentConnected = async () => {
    const res: any = await apiPing(channel);
    if (res?.code == 0) {
      dispatch(setAgentConnected(true));
    }
  };

  const onClickConnect = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    if (agentConnected) {
      await apiStopService(channel);
      dispatch(setAgentConnected(false));
      toast.success("Agent disconnected");
      stopPing();
    } else {
      const selectedGraph = graphList.find(
        (graph) => graph.graph_id === selectedGraphId
      );
      if (!selectedGraph) {
        toast.error("Please select a graph first");
        setLoading(false);
        return;
      }

      const res = await apiStartService({
        channel,
        userId,
        graphName: selectedGraph.name,
        language,
        voiceType,
      });
      const { code, msg } = res || {};
      if (code != 0) {
        if (code == "10001") {
          toast.error(
            "The number of users experiencing the program simultaneously has exceeded the limit. Please try again later."
          );
        } else {
          toast.error(`code:${code},msg:${msg}`);
        }
        setLoading(false);
        throw new Error(msg);
      }
      dispatch(setAgentConnected(true));
      toast.success("Agent connected");
      startPing();
    }
    setLoading(false);
  };

  const startPing = () => {
    if (intervalId) {
      stopPing();
    }
    intervalId = setInterval(() => {
      apiPing(channel);
    }, 3000);
  };

  const stopPing = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };


  return (
    <>
      {/* Action Bar */}
      <div
        className={cn(
          "mx-2 mt-2 flex items-center justify-between rounded-t-lg bg-[#181a1d] p-2 md:m-2 md:rounded-lg",
          className
        )}
      >
        <div className="flex items-center justify-end gap-2">
          {/* Graph 选择 */}
          <RemoteGraphSelect />

          {/* 连接按钮 */}
          <div className="flex items-center gap-2">
            <LoadingButton
              onClick={onClickConnect}
              variant={!agentConnected ? "default" : "destructive"}
              size="sm"
              disabled={!selectedGraphId && !agentConnected}
              className="w-fit min-w-24"
              loading={loading}
              svgProps={{ className: "h-4 w-4 text-muted-foreground" }}
            >
              {loading
                ? "连接中"
                : !agentConnected
                  ? "连接"
                  : "断开连接"}
            </LoadingButton>
          </div>
        </div>
      </div>
    </>
  );
}
