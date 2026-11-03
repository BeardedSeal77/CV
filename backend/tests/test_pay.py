"""Pay grading: the tax models against reference values, grades and targets,
city resolution, salary parsing and the pay check on jobs.

  cd backend && .venv/Scripts/python -m unittest tests.test_pay -v
"""

import unittest

from tests.sample_data import EXAMPLE  # noqa: F401  (sets up the sample data first)

from jobs.model.salary import parse_pay  # noqa: E402
from pay.model import grade, store  # noqa: E402
from pay.model.tax import net_monthly  # noqa: E402
from utils.pipeline import dispatch  # noqa: E402


def net(code: str, gross: float) -> float:
    country = store.country(code)
    return net_monthly(country.tax_model, gross, country.tax_params)


class TaxModelsTest(unittest.TestCase):
    """Reference values from the countries' own calculators; tolerance 1 a month."""

    def assertNet(self, code, gross, expected, months=1):
        self.assertAlmostEqual(net(code, gross) * months, expected, delta=1 * months, msg=f"{code} {gross}")

    def test_south_africa(self):
        self.assertNet("ZA", 20000, 17707.88)  # bottom bracket, UIF capped
        self.assertNet("ZA", 50000, 38747.30)

    def test_latvia(self):
        self.assertNet("LV", 2000, 1473.80)
        self.assertNet("LV", 3000, 2140.57)
        self.assertNet("LV", 6000, 4140.90)

    def test_lithuania(self):
        self.assertNet("LT", 3000, 1815)
        self.assertNet("LT", 6000, 3630)

    def test_poland_employment_contract_yearly(self):
        for gross, annual in {13500: 111034.76, 16000: 126307.84, 20000: 150744.36, 25000: 182448.55}.items():
            self.assertNet("PL", gross, annual, months=12)


class GradingTest(unittest.TestCase):
    def test_rent_share_drops_one_grade(self):
        g = store.grading()
        self.assertEqual(grade.grade_of(g, 1.6, 0.30), "A")
        self.assertEqual(grade.grade_of(g, 1.6, 0.45), "B")
        self.assertEqual(grade.grade_of(g, 0.5, 0.60), "D")

    def test_riga_target_matches_the_closed_form(self):
        # Latvia's tax is linear here: net = 0.666775 gross + 140.25
        h = grade.home()
        p = grade.place(h, store.city("riga"))
        needed_net = p.housing + h.cover * p.everyday
        expected = (needed_net - 140.25) / 0.666775
        self.assertAlmostEqual(grade.targets(h, p)["C"], expected, delta=10)

    def test_targets_reach_their_thresholds(self):
        h = grade.home()
        p = grade.place(h, store.city("krakow"))
        for letter, threshold in (("C", 1.0), ("B", 1.2), ("A", 1.5)):
            gross = grade.targets(h, p)[letter]
            self.assertAlmostEqual(grade.evaluate(h, p, gross)["vs_baseline"], threshold, delta=0.01)

    def test_the_baseline_grades_as_today(self):
        h = grade.home()
        today = grade.evaluate(h, grade.place(h, h.city), store.baseline().gross_monthly)
        self.assertEqual((today["vs_baseline"], today["grade"]), (1.0, "C"))


class CitiesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        numbeo = {"col_index": 50, "as_of": "2026-11-01", "source": "test"}
        housing = {"planning_monthly": 700, "as_of": "2026-11-01", "source": "test"}
        for slug, name, country, aliases in (
            ("vilnius", "Vilnius", "LT", ["Wilno"]),
            ("kaunas", "Kaunas", "LT", []),
            ("wroclaw", "Wrocław", "PL", ["Breslau"]),
        ):
            dispatch("pay.cities.upsert", {"slug": slug, "name": name, "country": country, "aliases": aliases,
                                           "numbeo": numbeo, "housing": housing})

    def test_resolution_ignores_case_and_accents(self):
        for text in ("Kraków", "Krakow", "Cracow", "KRAKÓW"):
            self.assertEqual(dispatch("pay.cities.resolve", {"text": text})["city_id"], "krakow", text)
        self.assertEqual(dispatch("pay.cities.resolve", {"text": "Wrocław (listed)"})["city_id"], "wroclaw")

    def test_two_cities_take_the_first_with_a_note(self):
        match = dispatch("pay.cities.resolve", {"text": "Vilnius or Kaunas"})
        self.assertEqual(match["city_id"], "vilnius")
        self.assertIn("kaunas", match["note"])

    def test_upsert_keeps_other_figures_and_validates(self):
        dispatch("pay.cities.upsert", {"slug": "kaunas", "housing": {"planning_monthly": 610, "as_of": "2026-11-02", "source": "test"}})
        city = dispatch("pay.cities.get", {"city": "kaunas"})["city"]
        self.assertEqual((city["housing"]["planning_monthly"], city["numbeo"]["col_index"]), (610, 50))
        with self.assertRaises(Exception):
            dispatch("pay.cities.upsert", {"slug": "nowhere", "name": "Nowhere", "country": "XX",
                                           "numbeo": {"col_index": 50, "as_of": "2026-11-01"}})


class SalaryTest(unittest.TestCase):
    def test_listing_texts(self):
        self.assertEqual(parse_pay("€5,000–8,500 / month gross"),
                         {"currency": "EUR", "min": 5000, "max": 8500, "period": "month", "basis": "gross"})
        self.assertEqual(parse_pay("From €4,500 / month + options")["min"], 4500)
        asked = parse_pay("Not listed (asked PLN 16,000 gross, UoP)")
        self.assertEqual((asked["currency"], asked["ask"], asked.get("min")), ("PLN", 16000, None))
        self.assertEqual(parse_pay("EUR 60k-80k per year")["period"], "year")
        self.assertIsNone(parse_pay("Not listed"))


class PayCheckTest(unittest.TestCase):
    def test_a_job_in_a_known_city_is_graded(self):
        job = dispatch("jobs.add", {"company": "Grade Co", "role": "Dev", "city": "Kraków",
                                    "pay": "PLN 15,000–18,000 / month gross (UoP)"})
        self.assertEqual(job["city_id"], "krakow")
        self.assertEqual((job["salary"]["min"], job["salary"]["max"]), (15000, 18000))
        check = dispatch("jobs.get", {"id": job["id"]})["pay_check"]
        self.assertIn(check["status"], ("ok", "stale_data"))
        self.assertEqual(set(check["grades"]), {"min", "max"})
        self.assertEqual(check["headline"], "min")
        self.assertTrue(check["blue_card"]["clears"])
        card = next(j for j in dispatch("jobs.list", {})["jobs"] if j["id"] == job["id"])
        self.assertEqual(card["pay_grade"]["headline_grade"], check["headline_grade"])

    def test_no_city_names_the_missing_file(self):
        job = dispatch("jobs.add", {"company": "Far Co", "role": "Dev", "city": "Utrecht", "pay": "EUR 5,000"})
        check = dispatch("jobs.get", {"id": job["id"]})["pay_check"]
        self.assertEqual(check["status"], "no_city")
        self.assertEqual(check["missing"], "data/jobhunt/pay/cities/utrecht.json")

    def test_no_salary_still_gives_targets(self):
        job = dispatch("jobs.add", {"company": "Quiet Co", "role": "Dev", "city": "Riga", "pay": "Not listed"})
        check = dispatch("jobs.get", {"id": job["id"]})["pay_check"]
        self.assertEqual((check["status"], check["headline_grade"]), ("no_salary", None))
        self.assertIn("C", check["targets"])

    def test_an_old_exchange_rate_is_stale(self):
        rate = store.fx().rates["EUR"]
        dispatch("pay.fx.update", {"currency": "EUR", "rate": rate.rate, "as_of": "2020-01-01", "source": "old"})
        try:
            check = dispatch("pay.quote", {"city": "riga", "gross": 5000})
            self.assertEqual(check["status"], "stale_data")
            self.assertTrue(any("EUR exchange rate" in s for s in check["stale"]))
        finally:
            dispatch("pay.fx.update", {"currency": "EUR", "rate": rate.rate, "as_of": rate.as_of, "source": rate.source})

    def test_the_headline_is_the_minimum_until_an_ask_is_recorded(self):
        job = dispatch("jobs.add", {"company": "Range Co", "role": "Dev", "city": "Riga", "pay": "€3,000–5,000 / month gross"})
        check = dispatch("jobs.get", {"id": job["id"]})["pay_check"]
        self.assertEqual((check["headline"], check["grades"]["min"]["gross"]), ("min", 3000))
        dispatch("jobs.record_application", {"id": job["id"], "salary_quoted": "EUR 4,500"})
        check = dispatch("jobs.get", {"id": job["id"]})["pay_check"]
        self.assertEqual((check["headline"], check["grades"]["ask"]["source"]), ("ask", "recorded"))

    def test_the_usual_ask_is_graded_alongside_capped_at_the_maximum(self):
        from jobs.model import pay_link, store as jobs_store

        job = dispatch("jobs.add", {"company": "Cap Co", "role": "Dev", "country": "LV", "city": "Riga",
                                    "pay": "€3,000–5,000 / month gross"})
        opp = jobs_store.read(job["id"])
        usual, note = pay_link._usual_ask(opp, {"LV": {"currency": "EUR", "min": 6000, "max": 6000}})
        self.assertEqual(usual["ask"], 5000)
        self.assertIn("capped at the listing's maximum", note)
        check = pay_link.pay_check(opp, {"LV": {"currency": "EUR", "min": 6000, "max": 6000}})
        self.assertEqual(check["headline"], "min")
        self.assertEqual(check["grades"]["usual_ask"]["gross"], 5000)

    def test_a_scheduled_figure_is_stale_only_after_its_next_release(self):
        old = {"avg_gross_as_of": "2025-12-31"}
        dispatch("pay.countries.upsert", {"code": "LV", **old, "avg_gross_next_release": "2999-02-15"})
        self.assertFalse(any("LV average wage" in s for s in dispatch("pay.quote", {"city": "riga", "gross": 5000})["stale"]))
        dispatch("pay.countries.upsert", {"code": "LV", **old, "avg_gross_next_release": "2026-02-15"})
        try:
            stale = dispatch("pay.quote", {"city": "riga", "gross": 5000})["stale"]
            self.assertTrue(any("LV average wage" in s and "next release 2026-02-15" in s for s in stale))
        finally:
            dispatch("pay.countries.upsert", {"code": "LV", "avg_gross_as_of": "2026-06-30", "avg_gross_next_release": None})

    def test_the_application_ask_and_the_offer_snapshot(self):
        job = dispatch("jobs.add", {"company": "Offer Co", "role": "Dev", "city": "Riga", "pay": "€4,000–6,000 / month gross"})
        applied = dispatch("jobs.record_application", {"id": job["id"], "salary_quoted": "EUR 5,500"})
        self.assertEqual(applied["salary"]["ask"], 5500)
        dispatch("jobs.move", {"id": job["id"], "column": "accepted"})
        events = dispatch("jobs.get", {"id": job["id"]})["events"]
        offer = next(e for e in events if e.get("status") == "Offer")
        self.assertEqual(offer["pay_check"]["grades"]["ask"]["gross"], 5500)


if __name__ == "__main__":
    unittest.main()
