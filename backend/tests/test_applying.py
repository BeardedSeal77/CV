"""What the first automated application run asked for: undated letters,
duplicate warnings, proof of submission, form-safe answers and stable PDF
names.

  cd backend && .venv/Scripts/python -m unittest tests.test_applying -v
"""

import base64
import os
import time
import unittest
from datetime import date

from tests.sample_data import EXAMPLE, SAMPLE  # noqa: F401  (sets up the sample data first)
from tests.test_handoff import fake_printer, place_pdf  # noqa: E402

from jobs.model import pdf, store  # noqa: E402
from jobs.model.letter import letter_date, strip_date  # noqa: E402
from jobs.model.profile import form_answers  # noqa: E402
from utils.datadir import cv_dir  # noqa: E402
from utils.errors import ActionError  # noqa: E402
from utils.pipeline import dispatch  # noqa: E402

# A 1x1 PNG
PNG = base64.b64encode(
    bytes.fromhex(
        "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
        "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082"
    )
).decode()
LETTER = "Sam Example\nTown · sam@example.com\n\n3 November 2026\n\nDear team,\n\nHello.\n\nKind regards,\nSam"


class LetterDateTest(unittest.TestCase):
    def test_a_date_block_is_taken_out(self):
        text, removed = strip_date(LETTER)
        self.assertEqual(removed, "3 November 2026")
        self.assertNotIn("2026", text)
        self.assertEqual(strip_date("Dear team,\n\nIn 2026 I built it.")[1], "")

    def test_saving_strips_the_date_and_the_page_prints_today(self):
        job = dispatch("jobs.add", {"company": "Dated Co", "role": "Dev"})
        saved = dispatch("jobs.set_letter", {"id": job["id"], "text": LETTER})
        self.assertEqual(saved["date_removed"], "3 November 2026")
        letter = dispatch("jobs.get_letter", {"id": job["id"]})
        self.assertNotIn("3 November 2026", letter["text"])
        self.assertEqual(letter["date"], letter_date())
        dispatch("jobs.update", {"id": job["id"], "letter_date": "2026-10-16"})
        self.assertEqual(dispatch("jobs.get_letter", {"id": job["id"]})["date"], "16 October 2026")

    def test_a_letter_pdf_from_an_earlier_day_is_printed_again(self):
        job = dispatch("jobs.add", {"company": "Overnight Co", "role": "Dev", "letter": "Dear team,\n\nHello."})
        place_pdf(job["id"], "letter")
        file = pdf.output_dir(job["id"]) / pdf.file_name(job["id"], "letter")
        yesterday = time.time() - 86400 - 60
        # Everything it prints from is older than yesterday's PDF
        for source in (store.letter_path(job["id"]), cv_dir() / "site.md"):
            os.utime(source, (yesterday - 3600, yesterday - 3600))
        os.utime(file, (yesterday, yesterday))
        with fake_printer():
            self.assertTrue(dispatch("jobs.build_pdf", {"id": job["id"], "kind": "letter"})["rebuilt"])
            # With a fixed date, yesterday's print still holds
            dispatch("jobs.update", {"id": job["id"], "letter_date": "2026-10-16"})
            os.utime(file, (yesterday, yesterday))
            self.assertFalse(dispatch("jobs.build_pdf", {"id": job["id"], "kind": "letter"})["rebuilt"])


class PdfNamesTest(unittest.TestCase):
    def test_building_removes_files_no_kind_uses(self):
        folder = pdf.output_dir(EXAMPLE)
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "Sam_Example_Example_Robotics_CV.pdf").write_bytes(b"%PDF old naming")
        with fake_printer():
            dispatch("jobs.build_pdf", {"id": EXAMPLE, "kind": "cv", "force": True})
        names = {f.name for f in folder.glob("*.pdf")}
        self.assertNotIn("Sam_Example_Example_Robotics_CV.pdf", names)
        self.assertIn("Sam_Example_CV.pdf", names)


class PacketTest(unittest.TestCase):
    def test_a_job_applied_to_before_warns(self):
        job = dispatch("jobs.add", {"company": "Twice Co", "role": "Dev", "letter": "Dear team,\n\nHi."})
        fresh = dispatch("jobs.application_packet", {"id": job["id"], "build_files": False})
        self.assertIsNone(fresh["already_applied"])
        dispatch("jobs.record_application", {"id": job["id"], "method": "indeed"})
        again = dispatch("jobs.application_packet", {"id": job["id"], "build_files": False})
        self.assertEqual(again["already_applied"]["date"], date.today().isoformat())
        self.assertIn("Already applied", again["warning"])

    def test_ready_to_type_answers(self):
        packet = dispatch("jobs.application_packet", {"id": EXAMPLE, "build_files": False})
        self.assertEqual([link["label"] for link in packet["links"]][:1], ["CV website"])
        self.assertIn("answers", packet["form_answers"])
        self.assertIsNotNone(packet["how_heard"])

    def test_short_answers_are_checked(self):
        checked = form_answers(
            {
                "notice_period": "3 months",
                "short_answers": {"notice_period": {"10": "Three calendar months", "50": "3 months/90 days"}},
            }
        )
        problems = " ".join(checked["problems"])
        self.assertIn("10-character version has 21", problems)
        self.assertIn("50-character version has a slash", problems)
        self.assertIn("work_authorisation: blank", problems)


class EvidenceTest(unittest.TestCase):
    def test_proof_is_kept_in_the_job_folder(self):
        job = dispatch("jobs.add", {"company": "Proof Co", "role": "Dev"})
        dispatch(
            "jobs.record_application",
            {
                "id": job["id"],
                "confirmation_url": "https://jobs.example.com/thanks",
                "confirmation_text": "Thank you for applying.",
                "reference": "REF-123",
                "screenshot": PNG,
            },
        )
        applied = [e for e in dispatch("jobs.get", {"id": job["id"]})["events"] if e.get("status") == "Applied"][-1]
        self.assertEqual(len(applied["evidence"]), 2)
        self.assertEqual(applied["link"], "https://jobs.example.com/thanks")
        self.assertIn("Reference: REF-123.", applied["note"])
        for name in applied["evidence"]:
            self.assertTrue((store.opp_dir(job["id"]) / name).is_file(), name)

    def test_no_proof_is_said_and_a_bad_screenshot_refused(self):
        job = dispatch("jobs.add", {"company": "Bare Co", "role": "Dev"})
        with self.assertRaises(ActionError):
            dispatch("jobs.record_application", {"id": job["id"], "screenshot": base64.b64encode(b"not an image").decode()})
        dispatch("jobs.record_application", {"id": job["id"]})
        applied = [e for e in dispatch("jobs.get", {"id": job["id"]})["events"] if e.get("status") == "Applied"][-1]
        self.assertIn("No proof of submission kept.", applied["note"])


class PayTargetsTest(unittest.TestCase):
    def test_targets_show_their_inputs(self):
        inputs = dispatch("pay.targets", {"city": "riga"})["targets"][0]["inputs"]
        self.assertEqual(set(inputs), {"baseline", "here", "fx"})
        self.assertEqual(inputs["fx"]["currency"], "EUR")
        self.assertIn("as_of", inputs["fx"])


if __name__ == "__main__":
    unittest.main()
