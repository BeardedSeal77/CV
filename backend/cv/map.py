# The CV content service: read and edit the Markdown sections in data/cv.
from cv.handlers.get_section import get_section
from cv.handlers.list_sections import list_sections
from cv.handlers.update_section import update_section

ACTIONS = {
    # ----------------------------------------------------------------
    # Sections
    'cv.list_sections': {'mode': 'sync', 'access': 'read', 'handler': list_sections, 'validators': [],
                         'permission': 'local'},
    'cv.get_section': {'mode': 'sync', 'access': 'read', 'handler': get_section, 'validators': [],
                       'permission': 'local', 'payload': {'required': ['name']}},
    'cv.update_section': {'mode': 'sync', 'access': 'write', 'handler': update_section, 'validators': [],
                          'permission': 'local', 'event': 'cv.section_updated',
                          'payload': {'required': ['name', 'content']}},
}

EVENTS = {}
PROCESSES = {}
