# The application lifecycle: one status per opportunity, plain data, no imports
# (DevTools reads this file without importing it). jobs.move and
# jobs.log_event are bound to it; a move it doesn't list is refused unless the
# caller passes correction=True. Each state names its board column.
APPLICATION = {
    'name': 'application',
    'entity_schema': 'jobhunt',
    'entity_table': 'opportunities',
    'states': {
        'Shortlisted': {
            'label': 'Shortlisted', 'column': 'backlog', 'flags': ['is_initial', 'is_active'],
            'transitions': [
                {'action': 'mark_ready', 'to': 'Ready', 'trigger': 'user'},
                {'action': 'apply', 'to': 'Applied', 'trigger': 'user'},
                {'action': 'not_interested', 'to': 'Not interested', 'trigger': 'user'},
                {'action': 'rule_out', 'to': 'Ruled out', 'trigger': 'user'},
                {'action': 'close', 'to': 'Closed', 'trigger': 'user'},
            ],
        },
        'Ready': {
            'label': 'Letter ready', 'column': 'backlog', 'flags': ['is_active'],
            'transitions': [
                {'action': 'back_to_shortlist', 'to': 'Shortlisted', 'trigger': 'user'},
                {'action': 'apply', 'to': 'Applied', 'trigger': 'user'},
                {'action': 'not_interested', 'to': 'Not interested', 'trigger': 'user'},
                {'action': 'rule_out', 'to': 'Ruled out', 'trigger': 'user'},
                {'action': 'close', 'to': 'Closed', 'trigger': 'user'},
            ],
        },
        'Applied': {
            'label': 'Applied', 'column': 'applied', 'flags': ['is_active'],
            'transitions': [
                {'action': 'screen', 'to': 'Screening', 'trigger': 'company'},
                {'action': 'interview', 'to': 'Interview', 'trigger': 'company'},
                {'action': 'offer', 'to': 'Offer', 'trigger': 'company'},
                {'action': 'reject', 'to': 'Rejected', 'trigger': 'company'},
                {'action': 'withdraw', 'to': 'Withdrawn', 'trigger': 'user'},
                {'action': 'close', 'to': 'Closed', 'trigger': 'company'},
            ],
        },
        'Screening': {
            'label': 'Screening call', 'column': 'interview', 'flags': ['is_active'],
            'transitions': [
                {'action': 'another_call', 'to': 'Screening', 'trigger': 'company'},
                {'action': 'interview', 'to': 'Interview', 'trigger': 'company'},
                {'action': 'offer', 'to': 'Offer', 'trigger': 'company'},
                {'action': 'reject', 'to': 'Rejected', 'trigger': 'company'},
                {'action': 'withdraw', 'to': 'Withdrawn', 'trigger': 'user'},
                {'action': 'close', 'to': 'Closed', 'trigger': 'company'},
            ],
        },
        'Interview': {
            'label': 'Interviewing', 'column': 'interview', 'flags': ['is_active'],
            'transitions': [
                {'action': 'another_round', 'to': 'Interview', 'trigger': 'company'},
                {'action': 'offer', 'to': 'Offer', 'trigger': 'company'},
                {'action': 'reject', 'to': 'Rejected', 'trigger': 'company'},
                {'action': 'withdraw', 'to': 'Withdrawn', 'trigger': 'user'},
                {'action': 'close', 'to': 'Closed', 'trigger': 'company'},
            ],
        },
        'Offer': {
            'label': 'Offer received', 'column': 'accepted', 'flags': ['is_active'],
            'transitions': [
                {'action': 'accept', 'to': 'Accepted', 'trigger': 'user'},
                {'action': 'decline_offer', 'to': 'Withdrawn', 'trigger': 'user'},
                {'action': 'offer_withdrawn', 'to': 'Rejected', 'trigger': 'company'},
            ],
        },
        'Accepted': {
            'label': 'Offer accepted', 'column': 'accepted', 'flags': ['is_terminal'],
            'transitions': [
                {'action': 'back_out', 'to': 'Withdrawn', 'trigger': 'user'},
            ],
        },
        'Rejected': {
            'label': 'Rejected', 'column': 'declined', 'flags': ['is_terminal'],
            'transitions': [
                {'action': 'reopen', 'to': 'Shortlisted', 'trigger': 'user'},
            ],
        },
        'Withdrawn': {
            'label': 'Withdrawn', 'column': 'declined', 'flags': ['is_terminal'],
            'transitions': [
                {'action': 'reopen', 'to': 'Shortlisted', 'trigger': 'user'},
            ],
        },
        'Closed': {
            'label': 'Closed', 'column': 'declined', 'flags': ['is_terminal'],
            'transitions': [
                {'action': 'reopen', 'to': 'Shortlisted', 'trigger': 'user'},
            ],
        },
        'Not interested': {
            'label': 'Not interested', 'column': 'not_interested', 'flags': ['is_terminal'],
            'transitions': [
                {'action': 'reconsider', 'to': 'Shortlisted', 'trigger': 'user'},
            ],
        },
        'Ruled out': {
            'label': 'Ruled out', 'column': 'archived', 'flags': ['is_terminal'],
            'transitions': [
                {'action': 'reconsider', 'to': 'Shortlisted', 'trigger': 'user'},
            ],
        },
    },
}
