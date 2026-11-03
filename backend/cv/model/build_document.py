from pathlib import PurePosixPath

from utils.printing import browser, merge, print_page, site_meta


def build_document(file_name: str) -> bytes | None:
    """The CV or portfolio PDF named in site.md (cvPdf, portfolioPdf), printed
    from the running website. None for any other name. Local mode serves these
    on demand; the public build writes them with scripts/cv-pdf.mjs."""
    site, _ = site_meta()
    name = site.get("name", "")
    documents = {}
    if site.get("cvPdf"):
        documents[PurePosixPath(site["cvPdf"]).name] = ("/cv", f"{name}: CV")
    if site.get("portfolioPdf"):
        documents[PurePosixPath(site["portfolioPdf"]).name] = ("/portfolio/print", f"{name}: Portfolio")
    if file_name not in documents:
        return None
    route, title = documents[file_name]
    with browser() as b:
        printed = print_page(b, route)
    data, _ = merge([printed], title)
    return data
