# The job hunt service: every door the board, the API and the MCP server use.
# DevTools reads this file without importing it, so every value is a literal
# or a handler imported by name.
from jobs.handlers.create_job import create_job
from jobs.handlers.expire_closed_jobs import expire_closed_jobs
from jobs.handlers.build_pdf import build_pdf
from jobs.handlers.get_job import get_job
from jobs.handlers.get_letter import get_letter
from jobs.handlers.get_letter_brief import get_letter_brief
from jobs.handlers.get_application_packet import get_application_packet
from jobs.handlers.get_job_stats import get_job_stats
from jobs.handlers.get_jobs_version import get_jobs_version
from jobs.handlers.list_jobs import list_jobs
from jobs.handlers.list_next_to_apply import list_next_to_apply
from jobs.handlers.log_event import log_event
from jobs.handlers.move_job import move_job
from jobs.handlers.on_job_changed import on_job_changed
from jobs.handlers.record_application import record_application
from jobs.handlers.search_jobs_by_email import search_jobs_by_email
from jobs.handlers.update_document import update_document
from jobs.handlers.update_letter import update_letter
from jobs.handlers.update_job import update_job
from jobs.processes import APPLICATION
from jobs.validators.resolve_application_status import resolve_application_status

ACTIONS = {
    # ----------------------------------------------------------------
    # Board
    'jobs.list': {'mode': 'sync', 'access': 'read', 'handler': list_jobs, 'validators': [],
                  'permission': 'local'},
    'jobs.get': {'mode': 'sync', 'access': 'read', 'handler': get_job, 'validators': [],
                 'permission': 'local', 'payload': {'required': ['id']}},
    'jobs.stats': {'mode': 'sync', 'access': 'read', 'handler': get_job_stats, 'validators': [],
                   'permission': 'local'},
    'jobs.version': {'mode': 'sync', 'access': 'read', 'handler': get_jobs_version, 'validators': [],
                     'permission': 'local'},

    # ----------------------------------------------------------------
    # Listing
    'jobs.add': {'mode': 'sync', 'access': 'write', 'handler': create_job, 'validators': [],
                 'permission': 'local', 'event': 'job.added',
                 'payload': {'required': ['company', 'role']}},
    'jobs.update': {'mode': 'sync', 'access': 'write', 'handler': update_job, 'validators': [],
                    'permission': 'local', 'event': 'job.updated',
                    'payload': {'required': ['id']}},

    # ----------------------------------------------------------------
    # Lifecycle
    'jobs.move': {'mode': 'sync', 'access': 'write', 'handler': move_job, 'validators': [],
                  'permission': 'local', 'event': 'job.moved',
                  'process': 'application', 'status_field': 'status',
                  'status_resolver': resolve_application_status,
                  'payload': {'required': ['id', 'column']}},
    'jobs.log_event': {'mode': 'sync', 'access': 'write', 'handler': log_event, 'validators': [],
                       'permission': 'local', 'event': 'job.event_logged',
                       'process': 'application', 'status_field': 'status',
                       'status_resolver': resolve_application_status,
                       'payload': {'required': ['id']}},
    # The API also runs this every hour (CV_TIMERS=1)
    'jobs.expire_closed': {'mode': 'sync', 'access': 'write', 'handler': expire_closed_jobs, 'validators': [],
                           'permission': 'local'},

    # ----------------------------------------------------------------
    # Documents
    'jobs.get_letter': {'mode': 'sync', 'access': 'read', 'handler': get_letter, 'validators': [],
                        'permission': 'local', 'payload': {'required': ['id']}},
    'jobs.set_letter': {'mode': 'sync', 'access': 'write', 'handler': update_letter, 'validators': [],
                        'permission': 'local', 'event': 'job.letter_saved',
                        'payload': {'required': ['id', 'text']}},
    'jobs.set_document': {'mode': 'sync', 'access': 'write', 'handler': update_document, 'validators': [],
                          'permission': 'local', 'event': 'job.document_saved',
                          'payload': {'required': ['id', 'doc']}},
    'jobs.build_pdf': {'mode': 'sync', 'access': 'write', 'handler': build_pdf, 'validators': [],
                       'permission': 'local', 'payload': {'required': ['id']}},

    # ----------------------------------------------------------------
    # Agents: drafting letters, applying and reading replies
    'jobs.letter_brief': {'mode': 'sync', 'access': 'read', 'handler': get_letter_brief, 'validators': [],
                          'permission': 'local', 'payload': {'required': ['id']}},
    'jobs.next_to_apply': {'mode': 'sync', 'access': 'read', 'handler': list_next_to_apply, 'validators': [],
                           'permission': 'local'},
    'jobs.application_packet': {'mode': 'sync', 'access': 'write', 'handler': get_application_packet,
                                'validators': [], 'permission': 'local', 'payload': {'required': ['id']}},
    'jobs.record_application': {'mode': 'sync', 'access': 'write', 'handler': record_application,
                                'validators': [], 'permission': 'local', 'event': 'job.applied',
                                'process': 'application', 'status_field': 'status',
                                'status_resolver': resolve_application_status,
                                'payload': {'required': ['id']}},
    'jobs.find_by_email': {'mode': 'sync', 'access': 'read', 'handler': search_jobs_by_email, 'validators': [],
                           'permission': 'local'},
}

EVENTS = {
    # CV_AUTOCOMMIT=1 commits each change to the data repo
    'job.added': [on_job_changed],
    'job.applied': [on_job_changed],
    'job.updated': [on_job_changed],
    'job.moved': [on_job_changed],
    'job.event_logged': [on_job_changed],
    'job.letter_saved': [on_job_changed],
    'job.document_saved': [on_job_changed],
}

PROCESSES = {'application': APPLICATION}
