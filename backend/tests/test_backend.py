"""Backend tests against a temporary copy of data.example.

  cd backend && .venv/Scripts/python -m unittest discover -s tests -v
"""

import threading
import unittest

from tests.sample_data import EXAMPLE, SAMPLE  # noqa: F401  (sets up the sample data first)

from app import app  # noqa: E402
from utils.errors import ActionError  # noqa: E402
from utils.maps import describe, registry  # noqa: E402
from utils.pipeline import dispatch  # noqa: E402


class MapsTest(unittest.TestCase):
    def test_actions_and_process_load(self):
        names = set(registry()["actions"])
        self.assertTrue({"jobs.list", "jobs.move", "jobs.add", "cv.get_section"} <= names)
        self.assertIn("application", registry()["processes"])

    def test_every_action_has_a_schema_and_description(self):
        for action in describe():
            self.assertTrue(action["description"], action["name"])
            self.assertEqual(action["input_schema"]["type"], "object", action["name"])


class JobsTest(unittest.TestCase):
    def test_list_counts_every_column(self):
        result = dispatch("jobs.list", {})
        self.assertEqual(
            set(result["stats"]["byColumn"]),
            {"backlog", "applied", "interview", "accepted", "declined", "not_interested", "expired"},
        )
        self.assertTrue(result["version"])

    def test_interest_defaults_from_fit_and_gates_the_queue(self):
        defaults = {
            fit: dispatch("jobs.add", {"company": f"Keen {fit or 'blank'} Co", "role": "Dev", "fit": fit})["interest"]
            for fit in ("Strong", "Good", "Stretch", "")
        }
        self.assertEqual(defaults, {"Strong": "High", "Good": "Medium", "Stretch": "Low", "": "Low"})
        medium = dispatch("jobs.add", {"company": "Medium Co", "role": "Dev", "fit": "Strong", "interest": "Medium"})
        high = dispatch("jobs.add", {"company": "High Co", "role": "Dev", "fit": "Good", "interest": "High"})
        low = dispatch("jobs.add", {"company": "Low Co", "role": "Dev", "fit": "Strong", "interest": "Low"})
        queue = [j["id"] for j in dispatch("jobs.next_to_apply", {"limit": 100})["needs_letter"]]
        self.assertNotIn(low["id"], queue)
        self.assertLess(queue.index(high["id"]), queue.index(medium["id"]))
        raised = dispatch("jobs.update", {"id": low["id"], "interest": "High"})
        self.assertEqual((raised["interest"], raised["column"]), ("High", "backlog"))

    def test_expired(self):
        job = dispatch("jobs.add", {"company": "Later Co", "role": "Dev", "fit": "Good"})
        gone = dispatch("jobs.move", {"id": job["id"], "column": "expired", "note": "Listing taken down"})
        self.assertEqual((gone["column"], gone["status"]), ("expired", "Expired"))
        with self.assertRaises(ActionError):
            dispatch("jobs.move", {"id": job["id"], "column": "applied"})
        self.assertEqual(dispatch("jobs.move", {"id": job["id"], "column": "backlog"})["status"], "Shortlisted")

    def test_add_lands_in_backlog_with_new_fields(self):
        job = dispatch(
            "jobs.add",
            {"company": "Acme", "role": "AI Engineer", "method": "linkedin", "hours": "40 h", "website": "https://acme.example", "posted": "2026-10-30"},
        )
        self.assertEqual((job["column"], job["status"], job["method"]), ("backlog", "Shortlisted", "linkedin"))
        self.assertEqual(job["dates"]["listed"], "2026-10-30")
        again = dispatch("jobs.add", {"company": "Acme", "role": "AI Engineer", "allow_duplicate": True})
        self.assertNotEqual(again["id"], job["id"])

    def test_lifecycle_guard_and_correction(self):
        job = dispatch("jobs.add", {"company": "Guard Co", "role": "Dev"})
        with self.assertRaises(ActionError) as caught:
            dispatch("jobs.move", {"id": job["id"], "column": "interview"})
        self.assertEqual(caught.exception.extra.get("code"), "transition_not_allowed")
        fixed = dispatch("jobs.move", {"id": job["id"], "column": "interview", "correction": True})
        self.assertEqual(fixed["column"], "interview")

    def test_full_journey_dates(self):
        job = dispatch("jobs.add", {"company": "Journey Co", "role": "Dev"})
        jid = job["id"]
        dispatch("jobs.move", {"id": jid, "column": "applied", "date": "2026-11-01"})
        dispatch("jobs.move", {"id": jid, "column": "interview", "status": "Screening", "date": "2026-11-03"})
        dispatch("jobs.log_event", {"id": jid, "status": "Interview", "date": "2026-11-05", "note": "Round 1"})
        dispatch("jobs.log_event", {"id": jid, "status": "Interview", "date": "2026-11-09", "note": "Round 2"})
        dispatch("jobs.move", {"id": jid, "column": "accepted", "date": "2026-11-12"})
        final = dispatch("jobs.move", {"id": jid, "column": "accepted", "status": "Accepted", "date": "2026-11-13"})
        dates = final["dates"]
        self.assertEqual(dates["applied"], "2026-11-01")
        self.assertEqual([i["date"] for i in dates["interviews"]], ["2026-11-03", "2026-11-05", "2026-11-09"])
        self.assertEqual(dates["outcome"], {"date": "2026-11-13", "status": "Accepted"})

    def test_not_interested_from_backlog_only(self):
        job = dispatch("jobs.add", {"company": "Skip Co", "role": "Dev"})
        skipped = dispatch("jobs.move", {"id": job["id"], "column": "not_interested"})
        self.assertEqual((skipped["column"], skipped["status"]), ("not_interested", "Not interested"))
        back = dispatch("jobs.move", {"id": job["id"], "column": "backlog"})
        self.assertEqual(back["status"], "Shortlisted")
        dispatch("jobs.move", {"id": job["id"], "column": "applied"})
        with self.assertRaises(ActionError) as caught:
            dispatch("jobs.move", {"id": job["id"], "column": "not_interested"})
        self.assertEqual(caught.exception.extra.get("code"), "transition_not_allowed")
        self.assertNotIn(job["id"], [j["id"] for j in dispatch("jobs.next_to_apply", {"limit": 100})["needs_letter"]])

    def test_status_must_belong_to_column(self):
        with self.assertRaises(ActionError) as caught:
            dispatch("jobs.move", {"id": SAMPLE, "column": "declined", "status": "Interview"})
        self.assertEqual(caught.exception.extra.get("code"), "invalid_payload")

    def test_letter_keeps_notes(self):
        before = dispatch("jobs.get_letter", {"id": EXAMPLE})
        self.assertTrue(before["notes"])
        dispatch("jobs.set_letter", {"id": EXAMPLE, "text": "Dear team,\n\nNew letter."})
        after = dispatch("jobs.get_letter", {"id": EXAMPLE})
        self.assertEqual(after["notes"], before["notes"])
        self.assertEqual(after["text"], "Dear team,\n\nNew letter.")
        self.assertTrue(dispatch("jobs.get", {"id": EXAMPLE})["hasLetter"])

    def test_update_validates(self):
        dispatch("jobs.update", {"id": SAMPLE, "hours": "32 h", "website": "https://s.example"})
        self.assertEqual(dispatch("jobs.get", {"id": SAMPLE})["hours"], "32 h")
        for bad in ({"id": SAMPLE, "posted": "2 Nov"}, {"id": SAMPLE, "method": "fax"}, {"id": SAMPLE, "nope": 1}):
            with self.assertRaises(ActionError):
                dispatch("jobs.update", bad)

    def test_version_changes_after_a_write(self):
        before = dispatch("jobs.version", {})["version"]
        dispatch("jobs.log_event", {"id": SAMPLE, "note": "A note"})
        self.assertNotEqual(before, dispatch("jobs.version", {})["version"])

    def test_concurrent_writes_keep_every_event(self):
        job = dispatch("jobs.add", {"company": "Busy Co", "role": "Dev"})
        threads = [
            threading.Thread(target=dispatch, args=("jobs.log_event", {"id": job["id"], "note": f"note {n}"}))
            for n in range(12)
        ]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        notes = [e["note"] for e in dispatch("jobs.get", {"id": job["id"]})["events"]]
        self.assertEqual(sum(n.startswith("note ") for n in notes), 12)

    def test_unknown_job_and_action(self):
        with self.assertRaises(ActionError) as caught:
            dispatch("jobs.get", {"id": "no-such-job"})
        self.assertEqual(caught.exception.status, 404)
        with self.assertRaises(ActionError):
            dispatch("jobs.nope", {})


class CvTest(unittest.TestCase):
    def test_sections(self):
        names = dispatch("cv.list_sections", {})["sections"]
        self.assertIn("site", names)
        content = dispatch("cv.get_section", {"name": "skills"})["content"]
        dispatch("cv.update_section", {"name": "skills", "content": content})
        with self.assertRaises(ActionError):
            dispatch("cv.update_section", {"name": "skills", "content": "---\nbad: [\n---\n"})
        with self.assertRaises(ActionError):
            dispatch("cv.get_section", {"name": "../jobhunt/x"})


class HttpTest(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_actions_route(self):
        res = self.client.post("/api/actions/jobs.list", json={})
        self.assertEqual(res.status_code, 200)
        self.assertIn("jobs", res.get_json())
        res = self.client.post("/api/actions/jobs.add", json={"role": "x"})
        self.assertEqual((res.status_code, res.get_json()["code"]), (400, "missing_fields"))

    def test_local_only_guard(self):
        self.assertEqual(self.client.get("/api/health", headers={"Host": "evil.example"}).status_code, 403)
        res = self.client.get("/api/health", headers={"Origin": "https://evil.example"})
        self.assertEqual(res.status_code, 403)
        self.assertEqual(self.client.get("/api/health").status_code, 200)

    def test_pdf_not_built(self):
        self.assertEqual(self.client.get(f"/api/pdf/{SAMPLE}").status_code, 404)

    def test_introspection(self):
        self.assertTrue(self.client.get("/api/actions").get_json())
        self.assertIn("application", self.client.get("/api/process/definitions").get_json())


if __name__ == "__main__":
    unittest.main()
