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

from flask import Flask, Response, jsonify, request, send_file

sys.path.insert(0, str(Path(__file__).resolve().parent))

from cv.model.build_document import build_document  # noqa: E402
from jobs.model import handoff  # noqa: E402
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
    if _hostname(request.host) not in allowed:
        return jsonify(error="This server only accepts local requests."), 403
    # /handoff/<token> is the one door a web page may knock on: the ticket
    # itself names the single origin it serves
    if origin and _hostname(origin) not in allowed and not request.path.startswith("/handoff/"):
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


def _handoff_headers(response: Response, origin: str) -> Response:
    response.headers["Access-Control-Allow-Origin"] = origin
    # A public HTTPS page reaching 127.0.0.1 needs this (private network access)
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
    response.headers["Vary"] = "Origin"
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.route("/handoff/<token>", methods=["GET", "OPTIONS"])
def serve_handoff(token: str):
    """One application PDF for the one page origin its ticket names, once
    (jobs.upload_ticket). OPTIONS answers the browser's preflight without
    using the ticket."""
    origin = request.headers.get("Origin", "")
    if request.method == "OPTIONS":
        ticket = handoff.check(token, origin)
        response = Response(status=204)
        response.headers["Access-Control-Allow-Methods"] = "GET"
        response.headers["Access-Control-Allow-Headers"] = request.headers.get("Access-Control-Request-Headers", "")
        response.headers["Access-Control-Max-Age"] = "60"
        return _handoff_headers(response, ticket["origin"])
    claimed = dispatch("jobs.claim_handoff", {"token": token, "origin": origin})
    response = send_file(claimed["path"], mimetype="application/pdf", as_attachment=True,
                         download_name=claimed["name"], max_age=0)
    return _handoff_headers(response, claimed["origin"])


@app.get("/api/documents/<file_name>")
def serve_document(file_name: str):
    """The CV or portfolio PDF named in site.md, printed on demand (local mode
    has no static build to serve it from)."""
    data = build_document(file_name)
    if data is None:
        raise NotFound(f"No document {file_name}")
    return Response(data, mimetype="application/pdf", headers={"Content-Disposition": f'inline; filename="{file_name}"'})


if __name__ == "__main__":
    app.run(
        host=os.environ.get("CV_API_HOST", "127.0.0.1"),
        port=int(os.environ.get("CV_API_PORT", "5400")),
        threaded=True,
    )
