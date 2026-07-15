from __future__ import annotations

import json
from typing import Any, Optional

from .client import UniFlowHttpClient


class UniFlowMemory:
    """LangChain BaseMemory-compatible Sidecar."""

    def __init__(self, base_url: str, session_id: str = "default") -> None:
        self.client = UniFlowHttpClient(base_url)
        self.session_id = session_id
        self.chat_memory: list[dict] = []

    def load_memory_variables(self, inputs: dict) -> dict:
        q = str(inputs.get("input") or inputs.get("query") or "")
        if q:
            try:
                hits = self.client.search_memory(q)
                docs = hits.get("results") or []
                return {"history": "\n".join(d.get("content", "") for d in docs)}
            except Exception:
                pass
        return {"history": "\n".join(m.get("content", "") for m in self.chat_memory[-20:])}

    def save_context(self, inputs: dict, outputs: dict) -> None:
        self.chat_memory.append({"role": "user", "content": str(inputs)})
        self.chat_memory.append({"role": "assistant", "content": str(outputs)})

    def clear(self) -> None:
        self.chat_memory.clear()


class LangChainAdapter:
    """Unit Wrapper for a LangChain chain / runnable."""

    def __init__(self, chain: Any) -> None:
        self.chain = chain
        self.type = "langchain"

    def execute(self, input_data: dict, context: Optional[dict] = None) -> dict:
        if hasattr(self.chain, "invoke"):
            result = self.chain.invoke(input_data)
        elif callable(self.chain):
            result = self.chain(input_data)
        else:
            result = input_data
        content = result if isinstance(result, str) else json.dumps(result, ensure_ascii=False)
        return {
            "content": content,
            "toolCalls": [],
            "stopReason": "stop",
            "metadata": {"framework": "langchain"},
        }

    def framework_info(self) -> dict:
        return {"name": "langchain", "version": "sidecar"}
