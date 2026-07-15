"""
Cross-lang Python demo: assume greeter Unit + Orchestrator already running,
or start greeter here and talk to Orchestrator.

Usage (from repo root, after pip install -e sdk/python and Orchestrator up):

  set UNIFLOW_URL=http://127.0.0.1:8787
  set GREETER_URL=http://127.0.0.1:9101/execute
  python examples/cross-lang/python/run_demo.py
"""

from __future__ import annotations

import json
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "sdk" / "python"))

from uniflow_sdk import UniFlowHttpClient  # noqa: E402

YAML_PATH = Path(__file__).resolve().parents[1] / "greeter.workflow.yaml"


class Greeter(BaseHTTPRequestHandler):
    def do_POST(self) -> None:  # noqa: N802
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        task = "world"
        try:
            body = json.loads(raw.decode("utf-8"))
            task = body.get("input", {}).get("task", task)
        except Exception:  # noqa: BLE001
            pass
        payload = json.dumps(
            {"content": f"hello {task}", "toolCalls": [], "stopReason": "stop", "metadata": {}}
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        return


def maybe_start_greeter(port: int) -> HTTPServer | None:
    if os.environ.get("SKIP_LOCAL_GREETER") == "1":
        return None
    server = HTTPServer(("127.0.0.1", port), Greeter)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def main() -> None:
    orch = os.environ.get("UNIFLOW_URL", "http://127.0.0.1:8787")
    greeter_port = int(os.environ.get("GREETER_PORT", "9101"))
    greeter_url = os.environ.get("GREETER_URL", f"http://127.0.0.1:{greeter_port}/execute")

    server = maybe_start_greeter(greeter_port)
    client = UniFlowHttpClient(orch)

    v = client.validate(YAML_PATH)
    v.raise_for_status()
    print("validate ok:", v.workflow_id)

    reg = client.load_and_register(
        YAML_PATH,
        bindings={"demo.greeter": {"type": "http", "endpoint": greeter_url}},
    )
    print("registered:", reg)

    run = client.start_workflow(reg["workflowId"], {"task": "python"}, sync=True)
    print("status:", run.get("status"))
    state = (run.get("result") or {}).get("state") or {}
    print("output.greet:", state.get("output.greet"))

    if server:
        server.shutdown()


if __name__ == "__main__":
    main()
