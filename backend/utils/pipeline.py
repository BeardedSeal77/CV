"""The one way into the backend: POST /api/actions/<name> and every MCP tool
call end here.

dispatch(name, payload):
  1. find the action in the merged maps
  2. check the payload contract, then parse it with the handler's model
  3. run the action's validators
  4. for a door bound to a process, check the status move is allowed
  5. run the handler
  6. publish the action's event to every subscriber in EVENTS
"""

import logging
from typing import Any

from pydantic import ValidationError

from utils.errors import ActionError, NotFound
from utils.maps import get_action, get_process, handlers_for_event, input_model

log = logging.getLogger("pipeline")


def _check_process(spec: dict, payload: Any) -> None:
    """Refuses a status move the process doesn't allow from the current status.
    A payload with correction=True skips the check, for fixing mistakes."""
    target = getattr(payload, spec.get("status_field", "status"), None)
    if not target or getattr(payload, "correction", False):
        return
    current = spec["status_resolver"](payload)
    if current is None:
        raise NotFound("No such job.")
    process = get_process(spec["process"])
    state = process["states"].get(current)
    if state is None:
        return
    allowed = {t["to"] for t in state["transitions"]}
    if target != current and target not in allowed:
        raise ActionError(
            f'Can\'t move from {current} to {target}. Allowed: {", ".join(sorted(allowed)) or "none"}. '
            "Pass correction: true to fix a mistake.",
            code="transition_not_allowed",
        )
    if target == current and current not in allowed:
        raise ActionError(f"The job is already {current}.", code="no_change")


def _invalid(err: ValidationError) -> ActionError:
    issues = "; ".join(f"{'.'.join(str(p) for p in e['loc']) or 'payload'}: {e['msg']}" for e in err.errors())
    return ActionError(issues, code="invalid_payload")


def dispatch(name: str, raw: dict | None) -> Any:
    spec = get_action(name)
    if spec is None:
        raise NotFound(f"Unknown action: {name}")
    raw = raw or {}
    if not isinstance(raw, dict):
        raise ActionError("The payload must be a JSON object.")

    missing = [k for k in spec.get("payload", {}).get("required", []) if raw.get(k) in (None, "")]
    if missing:
        raise ActionError(f"Missing: {', '.join(missing)}", code="missing_fields")

    model = input_model(spec["handler"])
    try:
        payload = model.model_validate(raw) if model else raw
    except ValidationError as err:
        raise _invalid(err) from None

    for validator in spec.get("validators", []):
        problem = validator(payload)
        if problem:
            raise ActionError(problem, code="invalid")

    if spec.get("process"):
        _check_process(spec, payload)

    try:
        result = spec["handler"](payload)
    except ValidationError as err:  # e.g. a merged record that no longer validates
        raise _invalid(err) from None

    event = spec.get("event")
    if event:
        for subscriber in handlers_for_event(event):
            try:
                subscriber(event, result)
            except Exception:  # a subscriber never fails the write
                log.exception("Subscriber %s failed for %s", subscriber.__name__, event)
    return result
