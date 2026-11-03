"""The agent workflows: letter briefs, the apply queue, application packets,
recording applications and reading replies, plus the MCP prompts and resources."""

import asyncio
import unittest

from tests.sample_data import EXAMPLE, SAMPLE

import mcp_server  # noqa: E402
from utils.errors import ActionError  # noqa: E402
from utils.pipeline import dispatch  # noqa: E402


class DuplicatesTest(unittest.TestCase):
    def test_same_link_or_company_and_role_is_refused(self):
        dispatch("jobs.add", {"company": "Dup Co", "role": "Dev", "url": "https://dup.example/jobs/1/"})
        for again in (
            {"company": "Other Name", "role": "Other", "url": "https://DUP.example/jobs/1"},
            {"company": "dup co", "role": "DEV"},
        ):
            with self.assertRaises(ActionError) as caught:
                dispatch("jobs.add", again)
            self.assertEqual(caught.exception.extra.get("code"), "duplicate")
        forced = dispatch("jobs.add", {"company": "Dup Co", "role": "Dev", "allow_duplicate": True})
        self.assertTrue(forced["id"].startswith("dup-co-dev"))


class EmailTest(unittest.TestCase):
    def test_same_email_is_logged_once(self):
        job = dispatch("jobs.add", {"company": "Mail Co", "role": "Dev", "url": "https://jobs.lever.co/mailco/1"})
        dispatch("jobs.record_application", {"id": job["id"], "sent": ["cv.pdf"]})
        event = {"id": job["id"], "status": "Rejected", "note": "No thanks", "source": "gmail:abc"}
        first = dispatch("jobs.log_event", event)
        again = dispatch("jobs.log_event", event)
        self.assertEqual((first["duplicate"], again["duplicate"]), (False, True))
        events = dispatch("jobs.get", {"id": job["id"]})["events"]
        self.assertEqual(sum(e.get("source") == "gmail:abc" for e in events), 1)
        self.assertEqual(again["status"], "Rejected")

    def test_find_by_email(self):
        job = dispatch("jobs.add", {"company": "Finder Robotics", "role": "AI Engineer", "website": "https://finderrobotics.com"})
        by_domain = dispatch("jobs.find_by_email", {"sender": "Talent <talent@careers.finderrobotics.com>"})
        self.assertEqual(by_domain["matches"][0]["id"], job["id"])
        by_name = dispatch("jobs.find_by_email", {"sender": "no-reply@ats.example", "subject": "Your application to Finder Robotics"})
        self.assertIn(job["id"], [m["id"] for m in by_name["matches"]])
        self.assertEqual(dispatch("jobs.find_by_email", {"sender": "friend@gmail.com"})["matches"], [])


class ApplyTest(unittest.TestCase):
    def test_queue_gates_on_fit_and_letter(self):
        strong = dispatch("jobs.add", {"company": "Queue Co", "role": "Dev", "fit": "Strong", "letter": "Dear team,\n\nHello."})
        stretch = dispatch("jobs.add", {"company": "Stretch Co", "role": "Dev", "fit": "Stretch", "letter": "Dear team,\n\nHi."})
        queue = dispatch("jobs.next_to_apply", {"limit": 50})
        ready = [j["id"] for j in queue["ready"]]
        self.assertIn(strong["id"], ready)
        self.assertNotIn(stretch["id"], ready)
        self.assertIn(SAMPLE, [j["id"] for j in queue["needs_letter"]])

    def test_packet_and_record(self):
        packet = dispatch("jobs.application_packet", {"id": EXAMPLE, "build_files": False})
        self.assertTrue(packet["letter"])
        self.assertEqual(packet["profile"]["contact"]["name"], "Sam Example")
        self.assertIn("notice_period", packet["profile"])
        with self.assertRaises(ActionError) as caught:
            dispatch("jobs.application_packet", {"id": SAMPLE, "build_files": False})
        self.assertEqual(caught.exception.extra.get("code"), "no_letter")

        job = dispatch("jobs.add", {"company": "Record Co", "role": "Dev"})
        done = dispatch("jobs.record_application", {"id": job["id"], "method": "linkedin", "sent": ["a.pdf"], "salary_quoted": "EUR 5,000"})
        self.assertEqual((done["column"], done["method"]), ("applied", "linkedin"))
        note = dispatch("jobs.get", {"id": job["id"]})["events"][-1]["note"]
        self.assertIn("Sent: a.pdf", note)
        self.assertIn("EUR 5,000", note)

    def test_letter_brief(self):
        brief = dispatch("jobs.letter_brief", {"id": SAMPLE})
        self.assertIn("about", brief["cv"])
        self.assertTrue(brief["rules"])
        self.assertTrue(brief["job"]["description"])
        self.assertTrue(all(e["text"] for e in brief["examples"]))


class McpTest(unittest.TestCase):
    def test_tools_prompts_and_resources(self):
        tools = {t.name for t in asyncio.run(mcp_server.list_tools())}
        self.assertTrue({"jobs_letter_brief", "jobs_application_packet", "jobs_record_application", "jobs_find_by_email"} <= tools)
        prompts = {p.name for p in asyncio.run(mcp_server.list_prompts())}
        self.assertEqual(prompts, {"draft_cover_letter", "apply_to_job", "triage_inbox"})
        filled = asyncio.run(mcp_server.get_prompt("draft_cover_letter", {"job_id": SAMPLE}))
        self.assertIn(SAMPLE, filled.messages[0].content.text)
        self.assertIn("Sam Example", asyncio.run(mcp_server.read_resource("jobs://profile")))
        self.assertTrue(asyncio.run(mcp_server.read_resource("cv://section/about")))

    def test_refusal_is_a_tool_error(self):
        result = asyncio.run(mcp_server.call_tool("jobs_move", {"id": SAMPLE, "column": "interview"}))
        self.assertTrue(result.isError)


if __name__ == "__main__":
    unittest.main()
