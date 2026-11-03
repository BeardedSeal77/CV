# The pay service: Ed's current job as the baseline, city and country data,
# and grading any pay against today. DevTools reads this file without
# importing it, so every value is a literal or a handler imported by name.
from pay.handlers.get_baseline import get_baseline
from pay.handlers.get_city import get_city
from pay.handlers.get_country import get_country
from pay.handlers.get_quote import get_quote
from pay.handlers.list_cities import list_cities
from pay.handlers.list_targets import list_targets
from pay.handlers.search_city import search_city
from pay.handlers.update_baseline import update_baseline
from pay.handlers.update_city import update_city
from pay.handlers.update_country import update_country
from pay.handlers.update_fx import update_fx

ACTIONS = {
    # ----------------------------------------------------------------
    # Baseline: Ed's current job
    'pay.baseline.get': {'mode': 'sync', 'access': 'read', 'handler': get_baseline, 'validators': [],
                         'permission': 'local'},
    'pay.baseline.update': {'mode': 'sync', 'access': 'write', 'handler': update_baseline, 'validators': [],
                            'permission': 'local'},

    # ----------------------------------------------------------------
    # Places
    'pay.cities.list': {'mode': 'sync', 'access': 'read', 'handler': list_cities, 'validators': [],
                        'permission': 'local'},
    'pay.cities.get': {'mode': 'sync', 'access': 'read', 'handler': get_city, 'validators': [],
                       'permission': 'local', 'payload': {'required': ['city']}},
    'pay.cities.resolve': {'mode': 'sync', 'access': 'read', 'handler': search_city, 'validators': [],
                           'permission': 'local', 'payload': {'required': ['text']}},
    'pay.cities.upsert': {'mode': 'sync', 'access': 'write', 'handler': update_city, 'validators': [],
                          'permission': 'local', 'payload': {'required': ['slug']}},
    'pay.countries.get': {'mode': 'sync', 'access': 'read', 'handler': get_country, 'validators': [],
                          'permission': 'local', 'payload': {'required': ['code']}},
    'pay.countries.upsert': {'mode': 'sync', 'access': 'write', 'handler': update_country, 'validators': [],
                             'permission': 'local', 'payload': {'required': ['code']}},
    'pay.fx.update': {'mode': 'sync', 'access': 'write', 'handler': update_fx, 'validators': [],
                      'permission': 'local', 'payload': {'required': ['currency', 'rate', 'as_of']}},

    # ----------------------------------------------------------------
    # Grading
    'pay.quote': {'mode': 'sync', 'access': 'read', 'handler': get_quote, 'validators': [],
                  'permission': 'local', 'payload': {'required': ['city']}},
    'pay.targets': {'mode': 'sync', 'access': 'read', 'handler': list_targets, 'validators': [],
                    'permission': 'local'},
}

EVENTS = {}

PROCESSES = {}
