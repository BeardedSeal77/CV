"""Loads every service's map.py and merges ACTIONS, EVENTS and PROCESSES.

A service is a folder under backend/ holding a map.py (folders starting with
`.` or `_`, and venv, tests and utils, are skipped). Action and process names
must be unique across services.
"""

import importlib
import inspect
from functools import lru_cache
from pathlib import Path
from typing import Any, Callable, get_type_hints

from pydantic import BaseModel

BACKEND = Path(__file__).resolve().parents[1]
SKIP = {"utils", "tests", "venv", ".venv", "node_modules", "__pycache__"}


def service_folders() -> list[str]:
    return sorted(
        p.name
        for p in BACKEND.iterdir()
        if p.is_dir() and p.name not in SKIP and not p.name.startswith((".", "_")) and (p / "map.py").is_file()
    )


@lru_cache(maxsize=1)
def registry() -> dict[str, Any]:
    actions: dict[str, dict] = {}
    events: dict[str, list[Callable]] = {}
    processes: dict[str, dict] = {}
    for service in service_folders():
        module = importlib.import_module(f"{service}.map")
        for name, spec in getattr(module, "ACTIONS", {}).items():
            if name in actions:
                raise RuntimeError(f"Action {name} is declared twice")
            actions[name] = {**spec, "service": service}
        for event, handlers in getattr(module, "EVENTS", {}).items():
            events.setdefault(event, []).extend(handlers if isinstance(handlers, list) else [handlers])
        for name, process in getattr(module, "PROCESSES", {}).items():
            if name in processes:
                raise RuntimeError(f"Process {name} is declared twice")
            processes[name] = process
    return {"actions": actions, "events": events, "processes": processes}


def get_action(name: str) -> dict | None:
    return registry()["actions"].get(name)


def handlers_for_event(event: str) -> list[Callable]:
    return registry()["events"].get(event, [])


def get_process(name: str) -> dict:
    return registry()["processes"][name]


def input_model(handler: Callable) -> type[BaseModel] | None:
    """A handler's payload model: the type of its first parameter."""
    params = list(inspect.signature(handler).parameters)
    if not params:
        return None
    hint = get_type_hints(handler).get(params[0])
    return hint if isinstance(hint, type) and issubclass(hint, BaseModel) else None


def describe() -> list[dict]:
    """Every action with its contract, for GET /api/actions and the MCP tools."""
    out = []
    for name, spec in sorted(registry()["actions"].items()):
        model = input_model(spec["handler"])
        out.append(
            {
                "name": name,
                "service": spec["service"],
                "mode": spec.get("mode", "sync"),
                "access": spec.get("access", "read"),
                "event": spec.get("event"),
                "process": spec.get("process"),
                "description": inspect.getdoc(spec["handler"]) or "",
                "required": spec.get("payload", {}).get("required", []),
                "input_schema": model.model_json_schema() if model else {"type": "object", "properties": {}},
            }
        )
    return out
