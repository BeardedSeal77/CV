"""Application PDFs and the upload hand-off: every kind of PDF, rebuilt only
when stale, and single-use tickets that serve one PDF to one page origin.

  cd backend && .venv/Scripts/python -m unittest tests.test_handoff -v
"""

import json
import os
import time
import unittest
from contextlib import contextmanager
from unittest import mock

from tests.sample_data import EXAMPLE, SAMPLE  # noqa: F401  (sets up the sample data first)

from app import app  # noqa: E402
from jobs.model import handoff, pdf, store  # noqa: E402
from utils.errors import ActionError  # noqa: E402
from utils.pipeline import dispatch  # noqa: E402

FORM = "https://jobs.example.com"
FUTURE = time.time() + 86400


def place_pdf(job_id: str, kind: str, body: bytes = b"%PDF-1.4 test") -> str:
    """A built PDF newer than its sources, so nothing needs printing."""
    folder = pdf.output_dir(job_id)
    folder.mkdir(parents=True, exist_ok=True)
    name = pdf.file_name(job_id, kind)
    (folder / name).write_bytes(body)
    os.utime(folder / name, (FUTURE, FUTURE))
    return name


@contextmanager
def fake_printer():
    """Stands in for Playwright: each part prints as one page."""

    @contextmanager
    def browser():
        yield object()

    with (
        mock.patch.object(pdf, "browser", browser),
        mock.patch.object(pdf, "print_page", lambda b, route: route.encode()),
        mock.patch.object(pdf, "merge", lambda parts, title: (b"%PDF-1.4 " + b"|".join(parts), [1] * len(parts))),
    ):
        yield


class PdfKindsTest(unittest.TestCase):
    def test_names_carry_the_company_only_for_the_letter(self):
        self.assertEqual(pdf.file_name(EXAMPLE, "cv"), "Sam_Example_CV.pdf")
        self.assertEqual(pdf.file_name(EXAMPLE, "letter"), "Sam_Example_Cover_Letter_Example_Robotics.pdf")
        self.assertEqual(pdf.file_name(EXAMPLE, "application"), "Sam_Example_Application_Example_Robotics.pdf")
        self.assertEqual(pdf.file_name(EXAMPLE, "cv_portfolio"), "Sam_Example_CV_with_Portfolio.pdf")

    def test_every_kind_prints_its_parts_in_order(self):
        with fake_printer():
            for kind, routes in {
                "cv": [b"/cv"],
                "letter": [f"/jobs/{EXAMPLE}/letter".encode()],
                "portfolio": [b"/portfolio/print"],
                "application": [f"/jobs/{EXAMPLE}/letter".encode(), b"/cv"],
                "cv_portfolio": [b"/cv", b"/portfolio/print"],
                "application_portfolio": [f"/jobs/{EXAMPLE}/letter".encode(), b"/cv", b"/portfolio/print"],
            }.items():
                built = dispatch("jobs.build_pdf", {"id": EXAMPLE, "kind": kind, "force": True})
                data = (pdf.output_dir(EXAMPLE) / built["name"]).read_bytes()
                self.assertEqual(data, b"%PDF-1.4 " + b"|".join(routes), kind)

    def test_a_fresh_pdf_is_reused_and_a_stale_one_rebuilt(self):
        place_pdf(EXAMPLE, "letter", b"%PDF-1.4 old")
        with fake_printer():
            self.assertFalse(dispatch("jobs.build_pdf", {"id": EXAMPLE, "kind": "letter"})["rebuilt"])
            file = pdf.output_dir(EXAMPLE) / pdf.file_name(EXAMPLE, "letter")
            os.utime(file, (1, 1))  # older than the letter
            self.assertTrue(dispatch("jobs.build_pdf", {"id": EXAMPLE, "kind": "letter"})["rebuilt"])

    def test_letter_kinds_need_a_letter(self):
        with self.assertRaises(ActionError) as caught:
            dispatch("jobs.build_pdf", {"id": SAMPLE, "kind": "application"})
        self.assertEqual(caught.exception.extra.get("code"), "no_letter")


class HandoffTest(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.name = place_pdf(EXAMPLE, "cv")

    def ticket(self, origin=FORM, kind="cv") -> str:
        result = dispatch("jobs.upload_ticket", {"id": EXAMPLE, "kind": kind, "origin": origin})
        self.assertEqual(result["name"], self.name if kind == "cv" else result["name"])
        return result["url"].split("/handoff/", 1)[1]

    def fetch(self, token, origin=FORM, method="get"):
        response = getattr(self.client, method)(f"/handoff/{token}", headers={"Origin": origin})
        response.get_data()  # read the body, then let go of the file
        response.close()
        return response

    def test_the_right_page_gets_the_pdf_once(self):
        token = self.ticket()
        first = self.fetch(token)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.data, b"%PDF-1.4 test")
        self.assertEqual(first.headers["Content-Type"], "application/pdf")
        self.assertEqual(first.headers["Access-Control-Allow-Origin"], FORM)
        self.assertEqual(first.headers["Access-Control-Allow-Private-Network"], "true")
        self.assertIn(self.name, first.headers["Content-Disposition"])
        self.assertEqual(self.fetch(token).status_code, 404)  # second use

        notes = [e["note"] for e in dispatch("jobs.get", {"id": EXAMPLE})["events"]]
        self.assertIn(f"Handed {self.name} to {FORM}.", notes)

    def test_a_wrong_origin_is_refused_and_leaves_the_ticket(self):
        token = self.ticket()
        for origin in ("https://evil.example", "", "null", f"{FORM}.evil.example"):
            self.assertEqual(self.fetch(token, origin).status_code, 403, origin)
        self.assertEqual(self.fetch(token).status_code, 200)

    def test_the_preflight_answers_without_using_the_ticket(self):
        token = self.ticket()
        pre = self.fetch(token, method="options")
        self.assertEqual(pre.status_code, 204)
        self.assertEqual(pre.headers["Access-Control-Allow-Private-Network"], "true")
        self.assertEqual(self.fetch(token, "https://evil.example", method="options").status_code, 403)
        self.assertEqual(self.fetch(token).status_code, 200)

    def test_an_expired_ticket_is_refused(self):
        token = self.ticket()
        path = handoff.tickets_dir() / f"{token}.json"
        ticket = json.loads(path.read_text())
        path.write_text(json.dumps({**ticket, "expires": time.time() - 1}))
        self.assertEqual(self.fetch(token).status_code, 410)
        self.assertEqual(self.fetch(token).status_code, 404)

    def test_a_ticket_for_a_file_outside_the_output_folder_is_refused(self):
        for name in ("../../opportunities/example-robotics-backend/opportunity.json", "../other/x.pdf", "missing.pdf"):
            token = self.ticket()
            path = handoff.tickets_dir() / f"{token}.json"
            path.write_text(json.dumps({**json.loads(path.read_text()), "name": name}))
            self.assertEqual(self.fetch(token).status_code, 403, name)

    def test_tokens_that_are_not_tokens_are_refused(self):
        for token in ("..%2F..%2Fbaseline", "short", "x" * 100):
            self.assertIn(self.fetch(token).status_code, (403, 404), token)

    def test_only_https_origins_unless_local(self):
        for origin in ("http://jobs.example.com", "https://jobs.example.com/apply", "jobs.example.com", "https://u:p@x.com"):
            with self.assertRaises(ActionError, msg=origin):
                dispatch("jobs.upload_ticket", {"id": EXAMPLE, "kind": "cv", "origin": origin})
        self.ticket("http://localhost:8080")

    def test_other_routes_still_refuse_web_pages(self):
        response = self.client.post("/api/actions/jobs.list", json={}, headers={"Origin": FORM})
        self.assertEqual(response.status_code, 403)

    def test_the_application_lists_the_files_handed_over(self):
        job = dispatch("jobs.add", {"company": "Attach Co", "role": "Dev", "letter": "Dear team,\n\nHello."})
        name = place_pdf(job["id"], "application")
        token = dispatch("jobs.upload_ticket", {"id": job["id"], "kind": "application", "origin": FORM})["url"].rsplit("/", 1)[1]
        self.assertEqual(self.fetch(token).status_code, 200)
        dispatch("jobs.record_application", {"id": job["id"]})
        applied = [e for e in dispatch("jobs.get", {"id": job["id"]})["events"] if e.get("status") == "Applied"][-1]
        self.assertIn(f"Sent: {name}.", applied["note"])

    def test_the_claim_door_is_not_an_agent_tool(self):
        import mcp_server

        self.assertIn("jobs_upload_ticket", mcp_server._ACTIONS)
        self.assertNotIn("jobs_claim_handoff", mcp_server._ACTIONS)


class EnglishDescriptionTest(unittest.TestCase):
    def test_a_translation_is_kept_beside_the_listing(self):
        dispatch("jobs.set_document", {"id": SAMPLE, "doc": "jd_en", "text": "Python developer, hybrid."})
        job = dispatch("jobs.get", {"id": SAMPLE})
        self.assertEqual(job["description_en"].strip(), "Python developer, hybrid.")
        self.assertTrue((store.opp_dir(SAMPLE) / "jd.en.md").is_file())


if __name__ == "__main__":
    unittest.main()
