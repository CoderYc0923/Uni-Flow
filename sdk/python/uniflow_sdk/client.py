from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional, Union

from .yaml_api import ValidationResult, validate_workflow_yaml


class UniFlowHttpClient:
    """HTTP client for Uni-Flow Orchestrator (+ YAML validate/register helpers)."""

    def __init__(self, base_url: str, headers: Optional[Dict[str, str]] = None) -> None:
        self.base_url = base_url.rstrip("/")
        self.headers = {"Content-Type": "application/json", **(headers or {})}

    def _request(self, method: str, path: str, body: Optional[dict] = None) -> dict:
        data = None if body is None else json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}{path}",
            data=data,
            headers=self.headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.URLError as e:
            raise ConnectionError(f"Uni-Flow Orchestrator unreachable at {self.base_url}: {e}") from e
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"Uni-Flow HTTP {e.code}: {e.read().decode()}") from e

    def health(self) -> dict:
        return self._request("GET", "/health")

    def validate(
        self,
        source: Union[str, Path],
        schema_path: Optional[Union[str, Path]] = None,
    ) -> ValidationResult:
        """Local schema validate (does not call Orchestrator)."""
        return validate_workflow_yaml(source, schema_path=schema_path)

    def load_and_register(
        self,
        source: Union[str, Path],
        bindings: Optional[Dict[str, Dict[str, Any]]] = None,
    ) -> dict:
        """
        Validate locally (optional safety) then POST /workflows/from-yaml.

        bindings example:
          {"demo.greeter": {"type": "http", "endpoint": "http://127.0.0.1:9101/execute"}}
        """
        text = Path(source).read_text(encoding="utf-8") if Path(str(source)).is_file() else str(source)
        result = self.validate(text)
        result.raise_for_status()
        return self._request("POST", "/workflows/from-yaml", {"yaml": text, "bindings": bindings or {}})

    def start_workflow(self, workflow_id: str, input_data: Optional[dict] = None, sync: bool = False) -> dict:
        return self._request(
            "POST",
            f"/workflows/{urllib.parse.quote(workflow_id)}/runs",
            {"input": input_data or {}, "sync": sync},
        )

    def get_run(self, workflow_id: str, run_id: str) -> dict:
        return self._request(
            "GET",
            f"/workflows/{urllib.parse.quote(workflow_id)}/runs/{urllib.parse.quote(run_id)}",
        )

    def resume(self, workflow_id: str, run_id: str, snapshot_id: Optional[str] = None) -> dict:
        return self._request(
            "POST",
            f"/workflows/{urllib.parse.quote(workflow_id)}/runs/{urllib.parse.quote(run_id)}/resume",
            {"snapshotId": snapshot_id},
        )

    def respond_hitl(
        self, workflow_id: str, run_id: str, approved: bool, responder: str = "python-sdk"
    ) -> dict:
        return self._request(
            "POST",
            f"/workflows/{urllib.parse.quote(workflow_id)}/runs/{urllib.parse.quote(run_id)}/hitl",
            {"approved": approved, "responder": responder},
        )

    def search_memory(self, query: str, top_k: int = 5) -> dict:
        qs = urllib.parse.urlencode({"q": query, "topK": top_k})
        return self._request("GET", f"/memory/search?{qs}")
