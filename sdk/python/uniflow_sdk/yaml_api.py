"""Workflow YAML validate + Orchestrator from-yaml helpers."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

try:
    import yaml  # type: ignore
except ImportError as e:  # pragma: no cover
    raise ImportError("Install PyYAML: pip install pyyaml") from e

try:
    import jsonschema  # type: ignore
except ImportError as e:  # pragma: no cover
    raise ImportError("Install jsonschema: pip install jsonschema") from e


def _default_schema_path() -> Path:
    # sdk/python/uniflow_sdk -> repo root schemas/
    here = Path(__file__).resolve()
    return here.parents[3] / "schemas" / "uniflow.workflow.schema.json"


def load_schema(schema_path: Optional[Union[str, Path]] = None) -> dict:
    path = Path(schema_path) if schema_path else _default_schema_path()
    return json.loads(path.read_text(encoding="utf-8"))


class ValidationResult:
    def __init__(self, ok: bool, errors: Optional[List[str]] = None, workflow_id: Optional[str] = None):
        self.ok = ok
        self.errors = errors or []
        self.workflow_id = workflow_id

    def raise_for_status(self) -> None:
        if not self.ok:
            raise ValueError("YAML validation failed:\n" + "\n".join(self.errors))


def validate_workflow_yaml(
    source: Union[str, Path],
    schema_path: Optional[Union[str, Path]] = None,
) -> ValidationResult:
    """Validate Workflow YAML against schemas/uniflow.workflow.schema.json."""
    text = Path(source).read_text(encoding="utf-8") if _looks_like_path(source) else str(source)
    try:
        doc = yaml.safe_load(text)
    except Exception as err:  # noqa: BLE001
        return ValidationResult(False, [f"Invalid YAML: {err}"])

    schema = load_schema(schema_path)
    validator = jsonschema.Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(doc), key=lambda e: list(e.path))
    if errors:
        msgs = [f"{'/'.join(str(p) for p in e.path) or '/'}: {e.message}" for e in errors]
        return ValidationResult(False, msgs)

    if not isinstance(doc, dict) or doc.get("apiVersion") != "uniflow/v1":
        return ValidationResult(False, ["apiVersion must be uniflow/v1"])

    workflow_id = None
    meta = doc.get("metadata") if isinstance(doc, dict) else None
    if isinstance(meta, dict):
        workflow_id = meta.get("id")
    return ValidationResult(True, [], str(workflow_id) if workflow_id else None)


def _looks_like_path(source: Union[str, Path]) -> bool:
    if isinstance(source, Path):
        return True
    p = Path(source)
    try:
        return p.exists() and p.is_file()
    except OSError:
        return False
