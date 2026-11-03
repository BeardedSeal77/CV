"""The job hunt backend: one generic route runs every action in the services'
maps. Local only: binds to 127.0.0.1 and refuses requests whose Host or Origin
isn't this machine (or a name listed in CV_ALLOWED_HOSTS, e.g. the compose
service name).

  python app.py                      dev server on 127.0.0.1:5400 (CV_API_PORT)
  gunicorn -b 0.0.0.0:5000 app:app   in Docker
"""

import logging
import os
import sys
from pathlib import Path
from urllib.parse import urlsplit

from flask import Flask, jsonify, request, send_file

sys.path.insert(0, str(Path(__file__).resolve().parent))

from jobs.model.pdf import output_file  # noqa: E402
from utils.errors import ActionError, NotFound  # noqa: E402
from utils.maps import describe, registry  # noqa: E402
from utils.pipeline import dispatch  # noqa: E402

LOCAL_HOSTS = {"127.0.0.1", "localhost", "::1"}
app = Flask(__name__)
app.json.sort_keys = False  # keep the view's field order
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


def _allowed_hosts() -> set[str]:
    extra = {h.strip() for h in os.environ.get("CV_ALLOWED_HOSTS", "").split(",") if h.strip()}
    return LOCAL_HOSTS | extra


def _hostname(value: str) -> str:
    try:
        return urlsplit(value if "://" in value else f"http://{value}").hostname or ""
    except ValueError:
        return ""


@app.before_request
def local_only():
    allowed = _allowed_hosts()
    origin = request.headers.get("Origin")
    if _hostname(request.host) not in allowed or (origin and _hostname(origin) not in allowed):
        return jsonify(error="This server only accepts local requests."), 403
    return None


@app.errorhandler(ActionError)
def action_error(err: ActionError):
    return jsonify(error=str(err), **err.extra), err.status


@app.get("/api/health")
def health():
    return jsonify(ok=True, actions=len(registry()["actions"]))


@app.get("/api/actions")
def actions():
    return jsonify(describe())


@app.get("/api/process/definitions")
def process_definitions():
    return jsonify(registry()["processes"])


@app.post("/api/actions/<name>")
def run_action(name: str):
    payload = request.get_json(silent=True)
    if payload is None and request.content_length:
        raise ActionError("The body must be JSON.")
    return jsonify(dispatch(name, payload or {}))


@app.get("/api/pdf/<job_id>")
def serve_pdf(job_id: str):
    """A built PDF: ?name=<file> (only names in that job's output folder), else the newest."""
    file = output_file(job_id, request.args.get("name"))
    if file is None:
        raise NotFound("No PDF built yet")
    return send_file(file, mimetype="application/pdf", download_name=file.name, as_attachment=False)


if __name__ == "__main__":
    app.run(
        host=os.environ.get("CV_API_HOST", "127.0.0.1"),
        port=int(os.environ.get("CV_API_PORT", "5400")),
        threaded=True,
    )
