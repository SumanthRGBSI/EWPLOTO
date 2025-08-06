(function() {
    'use strict';

    // --- Main Application Object ---
    const App = {};

    // --- MOCK DATABASE & APPLICATION STATE ---
    App.MOCK_DB = {
        users: [
            { id: 'sjones', name: 'Sarah Jones', roles: ['Coordinator', 'Requestor'] },
            { id: 'mross', name: 'Mike Ross', roles: ['EWP Approver', 'LOTO Reviewer'] },
            { id: 'jdoe', name: 'John Doe', roles: ['EWP Reviewer', 'Issuer'] },
            { id: 'pchen', name: 'Patricia Chen', roles: ['Area Authority'] }
                ]
            };