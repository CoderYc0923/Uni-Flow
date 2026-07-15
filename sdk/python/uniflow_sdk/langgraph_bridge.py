from __future__ import annotations

import json
from typing import Any, Dict, Iterator, Optional

from .client import UniFlowHttpClient


class UniFlowCheckpointer:
    """LangGraph Sidecar — stores checkpoints locally and can talk to Orchestrator."""

    def __init__(self, base_url: str, workflow_id: str = "langgraph") -> None:
        self.client = UniFlowHttpClient(base_url)
        self.workflow_id = workflow_id
        self._memory: Dict[str, Any] = {}

    def put(self, config: dict, checkpoint: dict, metadata: Optional[dict] = None) -> dict:
        thread_id = (config.get("configurable") or {}).get("thread_id", "default")
        self._memory[thread_id] = {"checkpoint": checkpoint, "metadata": metadata or {}}
        return config

    def get(self, config: dict) -> Optional[dict]:
        thread_id = (config.get("configurable") or {}).get("thread_id", "default")
        entry = self._memory.get(thread_id)
        return None if entry is None else entry["checkpoint"]

    def list(self, config: dict) -> Iterator[dict]:
        thread_id = (config.get("configurable") or {}).get("thread_id", "default")
        entry = self._memory.get(thread_id)
        if entry:
            yield entry["checkpoint"]


class LangGraphAdapter:
    """Unit Wrapper for an existing compiled LangGraph graph."""

    def __init__(self, graph: Any) -> None:
        self.graph = graph
        self.type = "langgraph"

    def execute(self, input_data: dict, context: Optional[dict] = None) -> dict:
        if hasattr(self.graph, "invoke"):
            result = self.graph.invoke(input_data)
        else:
            result = input_data
        content = result if isinstance(result, str) else json.dumps(result, ensure_ascii=False)
        return {
            "content": content,
            "toolCalls": [],
            "stopReason": "stop",
            "metadata": {"framework": "langgraph"},
        }

    def framework_info(self) -> dict:
        return {"name": "langgraph", "version": "sidecar"}
