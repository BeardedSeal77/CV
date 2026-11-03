# The job hunt backend: the Flask API (gunicorn) and, from the same image, the
# MCP server. Local only: compose publishes the ports on 127.0.0.1.
#
# Built through the DevTools mirror: the Playwright image (Ubuntu with Python
# 3.12 and Chromium already installed, so PDFs print without downloading a
# browser) and the approved PyPI index. Compose passes the index as build args.
ARG PLAYWRIGHT_IMAGE=localhost:5000/playwright
FROM ${PLAYWRIGHT_IMAGE}

ARG PIP_INDEX_URL
ARG PIP_TRUSTED_HOST
ENV PIP_INDEX_URL=${PIP_INDEX_URL} \
    PIP_TRUSTED_HOST=${PIP_TRUSTED_HOST} \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_BREAK_SYSTEM_PACKAGES=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app/backend
COPY backend/requirements.txt .
RUN python3 -m pip install --no-cache-dir -r requirements.txt

COPY backend/ .
# data/ is bind-mounted at /app/data by compose, never copied in

EXPOSE 5000 5401
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--threads", "4", "app:app"]
