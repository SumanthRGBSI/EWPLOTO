(function() {
    'use strict';

    // --- MOCK DATABASE & APPLICATION STATE ---
    const MOCK_DB = {
        users: [
            { id: 'sjones', name: 'Sarah Jones', roles: ['Coordinator', 'Requestor'] },
            { id: 'mross', name: 'Mike Ross', roles: ['EWP Approver', 'LOTO Reviewer'] },
            { id: 'jdoe', name: 'John Doe', roles: ['EWP Reviewer', 'Issuer'] },
            { id: 'pchen', name: 'Patricia Chen', roles: ['Area Authority'] }
        ],
        ewpTemplates: [
            {
                id: 'TPL-HW-01', name: 'Standard Hot Work', description: 'Template for welding, cutting, and grinding operations.',
                fields: [
                    { id: 'f1', name: 'Fire Watch Required', type: 'Boolean', required: true, options: [] },
                    { id: 'f2', name: 'Gas Detector Reading (LEL %)', type: 'Decimal', required: true, options: [] },
                    { id: 'f3', name: 'Fire Extinguisher Type', type: 'Dropdown', required: true, options: ['CO2', 'Dry Powder', 'Foam'] },
                ],
                preWorkChecklist: ['Confirm fire extinguisher is present and inspected.', 'Verify combustible materials are removed.', 'Test gas detector.'],
                postWorkChecklist: ['Monitor area for 30 minutes post-work.', 'Ensure all equipment is off.', 'Clean up work area.']
            },
            {
                id: 'TPL-CSE-01', name: 'Confined Space Entry', description: 'Template for entering tanks, vessels, or pits.',
                fields: [
                    { id: 'f4', name: 'Rescue Plan Attached', type: 'Boolean', required: true, options: [] },
                    { id: 'f5', name: 'Atmospheric Test Results', type: 'Multiline Text', required: true, options: [] },
                    { id: 'f6', name: 'Entry Date', type: 'DateTime', required: true, options: [] },
                ],
                preWorkChecklist: ['Verify air monitoring is calibrated.', 'Confirm rescue team is on standby.', 'Isolate all energy sources (LOTO).'],
                postWorkChecklist: ['Account for all personnel exiting.', 'Remove all tools.', 'Secure entry point.']
            }
        ],
        approvalTemplates: [
            {
                id: 'APP-STD-01', name: 'Standard 3-Step Approval', description: 'Requestor -> Reviewer -> Approver.',
                roles: [
                    { name: 'Requestor', suggestedUsers: ['sjones'] },
                    { name: 'EWP Reviewer', suggestedUsers: ['jdoe'] },
                    { name: 'EWP Approver', suggestedUsers: ['mross'] }
                ]
            },
            {
                id: 'APP-LOTO-01', name: 'LOTO Approval Workflow', description: 'Includes specific LOTO reviewer.',
                roles: [
                    { name: 'Requestor', suggestedUsers: ['sjones'] },
                    { name: 'EWP Reviewer', suggestedUsers: ['jdoe'] },
                    { name: 'LOTO Reviewer', suggestedUsers: ['mross'] },
                    { name: 'Area Authority', suggestedUsers: ['pchen'] },
                    { name: 'Issuer', suggestedUsers: ['jdoe'] }
                ]
            }
        ],
        permits: [
            { id: 1, number: 'PTW-2025-001', name: 'Weld support bracket on Pipe Rack R-11', loc: 'Area 5 - Processing Unit', status: 'Pending Approval', type: 'Hot Work', loto: { required: false, assets: [] }, contractor: 'WeldPro Inc.', coordinatorId: 'sjones', ewpTemplateId: 'TPL-HW-01', approvalTemplateId: 'APP-STD-01', startDate: '2025-08-06T09:00', endDate: '2025-08-06T17:00', data: {}, checklists: { pre: {}, post: {} } },
            { id: 2, number: 'PTW-2025-002', name: 'Confined Space Entry - Tank T-101', loc: 'Area 2', status: 'Issued', type: 'Confined Space', loto: { required: true, assets: [{procedure: 'PROC-001', assetName: 'Breaker PNL-B-03', assetId: 'EQ-1023'}] }, contractor: 'SafeSpace LLC', coordinatorId: 'sjones', ewpTemplateId: 'TPL-CSE-01', approvalTemplateId: 'APP-LOTO-01', startDate: '2025-08-07T08:30', endDate: '2025-08-07T12:30', data: {}, checklists: { pre: {}, post: {} } },
            { id: 4, number: 'PTW-2025-004', name: 'Pump P-502 Motor Replacement', loc: 'Pump House 1', status: 'Active', type: 'Mechanical', loto: { required: true, assets: [{procedure: 'PROC-002', assetName: 'Breaker PNL-B-03', assetId: 'EQ-1023'}, {procedure: 'PROC-003', assetName: 'Inlet Valve V-502', assetId: 'V-502'}] }, contractor: 'MechServe', coordinatorId: 'sjones', ewpTemplateId: 'TPL-HW-01', approvalTemplateId: 'APP-LOTO-01', startDate: '2025-08-05T10:00', endDate: '2025-08-05T18:00', data: {}, checklists: { pre: {}, post: {} } },
            { id: 5, number: 'PTW-2025-005', name: 'Electrical Maintenance on Panel P-04', loc: 'Control Room', status: 'Closed', type: 'Electrical', loto: { required: false, assets: [] }, contractor: 'SparkSafe', coordinatorId: 'sjones', ewpTemplateId: 'TPL-HW-01', approvalTemplateId: 'APP-STD-01', startDate: '2025-08-04T13:00', endDate: '2025-08-04T15:00', data: {}, checklists: { pre: {}, post: {} } }
        ],
        authorizations: {
            1: [ { role: 'Requestor', userId: 'sjones', date: '2025-08-05 09:15:22' } ],
            2: [ { role: 'Requestor', userId: 'sjones', date: '2025-08-06 11:45:03' }, { role: 'EWP Reviewer', userId: 'jdoe', date: '2025-08-06 14:00:19' }, { role: 'LOTO Reviewer', userId: 'mross', date: '2025-08-06 16:30:00' }, { role: 'Area Authority', userId: 'pchen', date: '2025-08-07 08:00:00' }, { role: 'Issuer', userId: 'jdoe', date: '2025-08-07 08:25:00' } ],
            4: [ { role: 'Requestor', userId: 'sjones', date: '2025-08-05 08:20:11' }, { role: 'EWP Reviewer', userId: 'jdoe', date: '2025-08-05 09:30:00' }, { role: 'LOTO Reviewer', userId: 'mross', date: '2025-08-05 10:00:00' }, { role: 'Area Authority', userId: 'pchen', date: '2025-08-05 10:15:00' }, { role: 'Issuer', userId: 'jdoe', date: '2025-08-05 10:30:00' }],
            5: [ { role: 'Requestor', userId: 'sjones', date: '2025-08-04 10:05:00' }, { role: 'EWP Reviewer', userId: 'jdoe', date: '2025-08-04 12:10:00' }, { role: 'EWP Approver', userId: 'mross', date: '2025-08-04 12:45:11' } ]
        },
        workers: {
            4: [ { id: 'W-8439', name: 'Alice Williams', task: 'Mechanical Fitting', contact: '555-0101', proof: 'Company ID' }, { id: 'W-8440', name: 'Bob Brown', task: 'Electrical Support', contact: '555-0102', proof: 'Company ID' } ],
            2: [ { id: 'W-9100', name: 'Eve Foreman', task: 'Entry Supervisor', contact: '555-0105', proof: 'Supervisor Cert' }]
        }
    };
    
    const AppState = { 
        activeView: 'dashboard', 
        activePermitId: null,
        activeTab: 'basic-details',
        currentUser: MOCK_DB.users[0]
    };
    
    // --- DOM & UTILITY FUNCTIONS ---
    const getEl = (id) => document.getElementById(id);
    const Views = {
        'dashboard': getEl('dashboard-view'),
        'templates': getEl('templates-view'),
        'create-permit': getEl('create-permit-view'),
        'permit-details': getEl('permit-details-view')
    };
    const NavLinks = {
        'dashboard': getEl('nav-dashboard'),
        'templates': getEl('nav-templates')
    };
    
    function navigate(viewName, data = null) {
        AppState.activeView = viewName;
        AppState.activePermitId = viewName === 'permit-details' ? data : null;
        Object.values(Views).forEach(v => v.classList.remove('active'));
        Object.values(NavLinks).forEach(l => l.classList.remove('active'));
        
        const activeView = Views[viewName];
        if (activeView) {
            activeView.classList.add('active');
            const activeNavLink = NavLinks[viewName];
            if (activeNavLink) activeNavLink.classList.add('active');
            
            switch(viewName) {
                case 'dashboard': renderDashboard(); break;
                case 'templates': renderTemplates(); break;
                case 'create-permit': renderCreatePermitForm(); break;
                case 'permit-details': renderPermitDetails(AppState.activePermitId); break;
            }
        }
    }
    
    function switchUser(userId) {
        AppState.currentUser = MOCK_DB.users.find(u => u.id === userId) || MOCK_DB.users[0];
        navigate(AppState.activeView, AppState.activePermitId);
    }
    
    function showModal(htmlContent) {
        const modalOverlay = getEl('modal-overlay');
        const modalContent = getEl('modal-content');
        modalContent.innerHTML = htmlContent;
        modalOverlay.classList.add('active');
        setTimeout(() => modalContent.classList.add('active'), 10);
    }
    
    function hideModal() {
        const modalOverlay = getEl('modal-overlay');
        const modalContent = getEl('modal-content');
        modalOverlay.classList.remove('active');
        modalContent.classList.remove('active');
    }
    
    function showConfirmation(title, message, onConfirm) {
        const content = `
            <div class="p-6 text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                </div>
                <h3 class="mt-5 text-lg font-semibold text-slate-900">${title}</h3>
                <p class="mt-2 text-sm text-slate-500">${message}</p>
            </div>
        `;
        showModal(content);
    }

    // --- DASHBOARD ---
    function renderDashboard() {
        const view = Views.dashboard;
        const permits = MOCK_DB.permits;
        const statusColors = {
            'Active': 'bg-green-100 text-green-800',
            'Issued': 'bg-sky-100 text-sky-800',
            'Work Stopped': 'bg-amber-100 text-amber-800',
            'LOTO In Progress': 'bg-blue-100 text-blue-800',
            'Pending Approval': 'bg-yellow-100 text-yellow-800',
            'Approved': 'bg-indigo-100 text-indigo-800',
            'Closed': 'bg-slate-100 text-slate-800',
        };

        view.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-3xl font-bold text-slate-900">Permit Dashboard</h2>
                <button onclick="navigate('create-permit')" class="btn bg-sky-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm hover:bg-sky-700">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                    Create New Permit
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${permits.map(p => `
                    <div class="bg-white rounded-xl shadow-md border border-slate-200/80 p-5 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all">
                        <div>
                            <div class="flex justify-between items-start">
                                 <span class="px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] || 'bg-gray-100 text-gray-800'}">${p.status}</span>
                                 <span class="text-sm font-semibold text-sky-700">${p.number}</span>
                            </div>
                            <h3 class="font-bold text-slate-800 mt-3 text-lg">${p.name}</h3>
                            <p class="text-sm text-slate-500 mt-1">${p.loc}</p>
                        </div>
                        <div class="mt-5 pt-4 border-t border-slate-200 flex justify-between items-center">
                             <div class="text-sm text-slate-600">
                                <strong>Ends:</strong> ${new Date(p.endDate).toLocaleDateString()}
                             </div>
                             <button onclick="navigate('permit-details', ${p.id})" class="btn bg-white border border-slate-300 text-slate-700 px-4 py-1.5 rounded-md font-medium hover:bg-slate-100 text-sm">View Details</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // --- TEMPLATE MANAGEMENT ---
    function renderTemplates() {
        Views.templates.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-3xl font-bold text-slate-900">Template Management</h2>
                 <button onclick="renderEwpTemplateForm()" class="btn bg-sky-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm hover:bg-sky-700">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                    Create Template
                </button>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div>
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-slate-800">EWP Templates</h3>
                        <button onclick="renderEwpTemplateForm()" class="btn bg-sky-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm hover:bg-sky-700">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                            New
                        </button>
                    </div>
                    <div id="ewp-templates-list" class="space-y-4"></div>
                </div>
                <div>
                     <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-slate-800">Approval Templates</h3>
                        <button onclick="renderApprovalTemplateForm()" class="btn bg-sky-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm hover:bg-sky-700">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                            New
                        </button>
                    </div>
                    <div id="approval-templates-list" class="space-y-4"></div>
                </div>
            </div>
        `;
        renderEwpTemplatesList();
        renderApprovalTemplatesList();
    }

    function renderEwpTemplatesList() {
        const container = getEl('ewp-templates-list');
        if (MOCK_DB.ewpTemplates.length === 0) {
            container.innerHTML = `<div class="text-center py-12 bg-white rounded-lg border border-dashed"><p class="text-slate-500">No EWP templates found.</p></div>`;
            return;
        }
        container.innerHTML = MOCK_DB.ewpTemplates.map(t => `
            <div class="bg-white p-4 rounded-lg shadow-md border border-slate-200">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-slate-900">${t.name}</h4>
                        <p class="text-sm text-slate-600 mt-1">${t.description}</p>
                    </div>
                    <div class="flex-shrink-0 flex items-center gap-2">
                        <button onclick="renderEwpTemplateForm('${t.id}')" class="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-sky-600"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                        <button onclick="deleteEwpTemplate('${t.id}')" class="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-red-600"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderApprovalTemplatesList() {
        const container = getEl('approval-templates-list');
         if (MOCK_DB.approvalTemplates.length === 0) {
            container.innerHTML = `<div class="text-center py-12 bg-white rounded-lg border border-dashed"><p class="text-slate-500">No Approval templates found.</p></div>`;
            return;
        }
        container.innerHTML = MOCK_DB.approvalTemplates.map(t => `
             <div class="bg-white p-4 rounded-lg shadow-md border border-slate-200">
                 <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-slate-900">${t.name}</h4>
                        <p class="text-sm text-slate-600 mt-1">${t.description}</p>
                    </div>
                    <div class="flex-shrink-0 flex items-center gap-2">
                        <button onclick="renderApprovalTemplateForm('${t.id}')" class="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-sky-600"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                        <button onclick="deleteApprovalTemplate('${t.id}')" class="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-red-600"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                    </div>
                </div>
                <div class="mt-3 border-t pt-3">
                    <h5 class="text-xs font-semibold text-slate-500 uppercase">Approval Sequence</h5>
                    <div class="flex items-center flex-wrap gap-2 mt-2">
                        ${t.roles.map(r => `<span class="text-sm font-medium bg-sky-100 text-sky-800 px-3 py-1 rounded-full">${r.name}</span>`).join('<span class="text-slate-400 font-bold">&rarr;</span>')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderEwpTemplateForm(templateId = null) {
        const isEditing = templateId !== null;
        const template = isEditing ? JSON.parse(JSON.stringify(MOCK_DB.ewpTemplates.find(t => t.id === templateId))) : { id: `TPL-EWP-${Date.now()}`, name: '', description: '', fields: [], preWorkChecklist: [], postWorkChecklist: [] };
        const fieldTypes = ['String', 'Multiline Text', 'Integer', 'Decimal', 'DateTime', 'Boolean', 'Dropdown'];

        const formHtml = `
            <form id="ewp-template-form" class="p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                <h3 class="text-xl font-bold text-slate-900">${isEditing ? 'Edit' : 'Create'} EWP Template</h3>
                <div>
                    <label for="tplName" class="block text-sm font-medium text-slate-700">Template Name</label>
                    <input type="text" id="tplName" required class="mt-1 block w-full rounded-md border-slate-300" value="${template.name}">
                </div>
                <div>
                    <label for="tplDesc" class="block text-sm font-medium text-slate-700">Description</label>
                    <textarea id="tplDesc" rows="2" class="mt-1 block w-full rounded-md border-slate-300">${template.description}</textarea>
                </div>
                
                <div>
                    <h4 class="text-md font-semibold text-slate-800">Custom Fields</h4>
                    <div id="custom-fields-container" class="mt-2 space-y-3"></div>
                    <button type="button" id="add-custom-field-btn" class="mt-2 btn text-sm text-sky-600 font-semibold hover:text-sky-800 flex items-center gap-1">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                        Add Field
                    </button>
                </div>

                <div class="flex justify-end gap-4 pt-6 border-t">
                    <button type="button" onclick="hideModal()" class="btn bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-md font-medium text-sm">Cancel</button>
                    <button type="submit" class="btn bg-sky-600 text-white px-8 py-2 rounded-md font-semibold text-sm">Save Template</button>
                </div>
            </form>
        `;
        showModal(formHtml);

        const fieldsContainer = getEl('custom-fields-container');
        
        const renderFields = () => {
            fieldsContainer.innerHTML = template.fields.map((field, index) => {
                const fieldId = `field-${index}`;
                let optionsHtml = '';
                if (field.type === 'Dropdown') {
                    optionsHtml = `
                        <div class="mt-2">
                            <div class="flex items-center gap-2">
                                <input type="text" id="${fieldId}-new-option" class="flex-grow rounded-md border-slate-300 text-sm" placeholder="Add new option">
                                <button type="button" data-index="${index}" class="add-option-btn btn bg-sky-500 text-white px-3 py-1 text-sm rounded-md">Add</button>
                            </div>
                            <div id="${fieldId}-options-tags" class="mt-2 flex flex-wrap gap-2">
                                ${(field.options || []).map((option, optIndex) => `
                                    <span class="bg-slate-200 text-slate-700 text-sm font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                        ${option}
                                        <button type="button" data-index="${index}" data-opt-index="${optIndex}" class="remove-option-btn">
                                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                                        </button>
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="p-2 bg-slate-50 rounded-md border">
                        <div class="flex items-start gap-2">
                            <input type="text" class="flex-grow rounded-md border-slate-300 text-sm" value="${field.name}" placeholder="Field Name" data-index="${index}" data-prop="name">
                            <select class="rounded-md border-slate-300 text-sm" data-index="${index}" data-prop="type">
                                ${fieldTypes.map(t => `<option ${field.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                            <label class="flex items-center text-sm gap-1.5 whitespace-nowrap pt-2"><input type="checkbox" class="rounded" ${field.required ? 'checked' : ''} data-index="${index}" data-prop="required"> Required</label>
                            <button type="button" data-index="${index}" class="remove-field-btn p-2 text-slate-400 hover:text-red-500 mt-1"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                        </div>
                        ${optionsHtml}
                    </div>
                `;
            }).join('');
        };

        // Use event delegation: attach listeners ONCE to the container.
        // This prevents memory leaks and bugs from multiple identical listeners.
        fieldsContainer.addEventListener('change', (e) => {
            if (e.target.matches('input[data-prop], select[data-prop]')) {
                const index = e.target.dataset.index;
                const prop = e.target.dataset.prop;
                if (index === undefined || prop === undefined) return;

                const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                template.fields[index][prop] = value;
                
                if (prop === 'type') {
                    if(value !== 'Dropdown') {
                        template.fields[index].options = [];
                    }
                    renderFields(); // Just re-render, no need to re-attach listeners
                }
            }
        });

        fieldsContainer.addEventListener('click', (e) => {
            const removeFieldBtn = e.target.closest('.remove-field-btn');
            if (removeFieldBtn) {
                template.fields.splice(removeFieldBtn.dataset.index, 1);
                renderFields();
                return;
            }

            const addOptionBtn = e.target.closest('.add-option-btn');
            if (addOptionBtn) {
                const index = addOptionBtn.dataset.index;
                const newOptionInput = getEl(`field-${index}-new-option`);
                if (newOptionInput && newOptionInput.value.trim()) {
                    if (!template.fields[index].options) template.fields[index].options = [];
                    template.fields[index].options.push(newOptionInput.value.trim());
                    newOptionInput.value = '';
                    renderFields();
                }
                return;
            }

            const removeOptionBtn = e.target.closest('.remove-option-btn');
            if (removeOptionBtn) {
                const { index, optIndex } = removeOptionBtn.dataset;
                template.fields[index].options.splice(optIndex, 1);
                renderFields();
            }
        });

        renderFields(); // Initial render

        getEl('add-custom-field-btn').onclick = () => {
            template.fields.push({ id: `f-${Date.now()}`, name: '', type: 'String', required: false, options: [] });
            renderFields(); // Just re-render
        };

        getEl('ewp-template-form').onsubmit = (e) => {
            e.preventDefault();
            template.name = getEl('tplName').value;
            template.description = getEl('tplDesc').value;
            if (isEditing) {
                const index = MOCK_DB.ewpTemplates.findIndex(t => t.id === templateId);
                MOCK_DB.ewpTemplates[index] = template;
            } else {
                MOCK_DB.ewpTemplates.push(template);
            }
            hideModal();
            renderTemplates();
        };
    }

    function deleteEwpTemplate(templateId) {
        showConfirmation('Delete EWP Template?', 'This action cannot be undone. All associated data may be affected.', () => {
            const index = MOCK_DB.ewpTemplates.findIndex(t => t.id === templateId);
            if (index > -1) MOCK_DB.ewpTemplates.splice(index, 1);
            hideModal();
            renderTemplates();
        });
    }

    function renderApprovalTemplateForm(templateId = null) {
        const isEditing = templateId !== null;
        const template = isEditing ? JSON.parse(JSON.stringify(MOCK_DB.approvalTemplates.find(t => t.id === templateId))) : { id: `APP-${Date.now()}`, name: '', description: '', roles: [] };
        const allRoles = ['Requestor', 'EWP Reviewer', 'EWP Approver', 'LOTO Reviewer', 'Area Authority', 'Issuer', 'Supervisor'];

        const formHtml = `
            <form id="approval-template-form" class="p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                <h3 class="text-xl font-bold text-slate-900">${isEditing ? 'Edit' : 'Create'} Approval Template</h3>
                <div>
                    <label for="approvalTplName" class="block text-sm font-medium text-slate-700">Template Name</label>
                    <input type="text" id="approvalTplName" required class="mt-1 block w-full rounded-md border-slate-300" value="${template.name}">
                </div>
                <div>
                    <label for="approvalTplDesc" class="block text-sm font-medium text-slate-700">Description</label>
                    <textarea id="approvalTplDesc" rows="2" class="mt-1 block w-full rounded-md border-slate-300">${template.description}</textarea>
                </div>
                
                <div>
                    <h4 class="text-md font-semibold text-slate-800">Approval Roles (in sequence)</h4>
                    <div id="approval-roles-container" class="mt-2 space-y-3"></div>
                    <button type="button" id="add-approval-role-btn" class="mt-2 btn text-sm text-sky-600 font-semibold hover:text-sky-800 flex items-center gap-1">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                        Add Role
                    </button>
                </div>

                <div class="flex justify-end gap-4 pt-6 border-t">
                    <button type="button" onclick="hideModal()" class="btn bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-md font-medium text-sm">Cancel</button>
                    <button type="submit" class="btn bg-sky-600 text-white px-8 py-2 rounded-md font-semibold text-sm">Save Template</button>
                </div>
            </form>
        `;
        showModal(formHtml);

        const rolesContainer = getEl('approval-roles-container');
        const renderRoles = () => {
            rolesContainer.innerHTML = template.roles.map((role, index) => `
                <div class="flex items-center gap-2 p-3 bg-slate-50 rounded-md border">
                    <span class="font-bold text-slate-500">${index + 1}.</span>
                    <select class="flex-grow rounded-md border-slate-300 text-sm" onchange="template.roles[${index}].name = this.value">
                        ${allRoles.map(r => `<option ${role.name === r ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>
                    <button type="button" onclick="template.roles.splice(${index}, 1); renderRoles()" class="p-2 text-slate-400 hover:text-red-500"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                </div>
            `).join('');
        };
        renderRoles();
        
        getEl('add-approval-role-btn').onclick = () => {
            template.roles.push({ name: 'EWP Reviewer', suggestedUsers: [] });
            renderRoles();
        };

        getEl('approval-template-form').onsubmit = e => {
            e.preventDefault();
            template.name = getEl('approvalTplName').value;
            template.description = getEl('approvalTplDesc').value;
             if (isEditing) {
                const index = MOCK_DB.approvalTemplates.findIndex(t => t.id === templateId);
                MOCK_DB.approvalTemplates[index] = template;
            } else {
                MOCK_DB.approvalTemplates.push(template);
            }
            hideModal();
            renderTemplates();
        };
    }

    function deleteApprovalTemplate(templateId) {
         showConfirmation('Delete Approval Template?', 'This action cannot be undone.', () => {
            const index = MOCK_DB.approvalTemplates.findIndex(t => t.id === templateId);
            if (index > -1) MOCK_DB.approvalTemplates.splice(index, 1);
            hideModal();
            renderTemplates();
        });
    }

    // --- PERMIT WORKFLOWS ---
    function renderCreatePermitForm() {
        const view = Views['create-permit'];
        const now = new Date();
        const startDate = now.toISOString().substring(0, 10);
        const startTime = now.toTimeString().substring(0,5);
        now.setHours(now.getHours() + 8);
        const endDate = now.toISOString().substring(0, 10);
        const endTime = now.toTimeString().substring(0,5);

        view.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg border border-slate-200/80">
                <div class="p-6 border-b">
                     <h2 class="text-2xl font-bold text-slate-900">Create Work Permit</h2>
                </div>
                <form id="create-permit-form" class="p-8 space-y-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div>
                            <label for="permitName" class="block text-sm font-medium text-slate-700">Name</label>
                            <input type="text" id="permitName" required class="mt-1 block w-full rounded-md border-slate-300 shadow-sm" value="Routine Maintenance Task">
                        </div>
                        <div>
                            <label for="ewpId" class="block text-sm font-medium text-slate-700">EWP ID</label>
                            <input type="text" id="ewpId" class="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-slate-100" value="PTW-2025-0XX" readonly>
                        </div>
                        <div>
                            <label for="startDate" class="block text-sm font-medium text-slate-700">Start Date *</label>
                            <input type="date" id="startDate" required class="mt-1 block w-full rounded-md border-slate-300 shadow-sm" value="${startDate}">
                        </div>
                         <div>
                            <label for="endDate" class="block text-sm font-medium text-slate-700">End Date *</label>
                            <input type="date" id="endDate" required class="mt-1 block w-full rounded-md border-slate-300 shadow-sm" value="${endDate}">
                        </div>
                         <div>
                            <label for="startTime" class="block text-sm font-medium text-slate-700">Permit Start Hours *</label>
                            <input type="time" id="startTime" required class="mt-1 block w-full rounded-md border-slate-300 shadow-sm" value="${startTime}">
                        </div>
                        <div>
                            <label for="endTime" class="block text-sm font-medium text-slate-700">Permit End Hours *</label>
                            <input type="time" id="endTime" required class="mt-1 block w-full rounded-md border-slate-300 shadow-sm" value="${endTime}">
                        </div>
                        <div>
                            <label for="permitType" class="block text-sm font-medium text-slate-700">Permit Type *</label>
                            <select id="permitType" required class="mt-1 block w-full rounded-md border-slate-300 shadow-sm">
                                <option>General Work</option> <option>Hot Work</option> <option>Confined Space</option>
                            </select>
                        </div>
                        <div>
                            <label for="location" class="block text-sm font-medium text-slate-700">Location *</label>
                            <select id="location" required class="mt-1 block w-full rounded-md border-slate-300 shadow-sm">
                                <option>Area 1</option> <option>Area 2</option> <option>Pump House 1</option>
                            </select>
                        </div>
                        <div>
                            <label for="contractor" class="block text-sm font-medium text-slate-700">Contractor *</label>
                            <select id="contractor" required class="mt-1 block w-full rounded-md border-slate-300 shadow-sm">
                                <option>In-House</option> <option>Contractor A</option> <option>Contractor B</option>
                            </select>
                        </div>
                        <div>
                            <label for="plant" class="block text-sm font-medium text-slate-700">Plant *</label>
                            <select id="plant" required class="mt-1 block w-full rounded-md border-slate-300 shadow-sm">
                                <option>Main Plant</option> <option>Utility Plant</option>
                            </select>
                        </div>
                         <div class="md:col-span-2">
                            <label for="description" class="block text-sm font-medium text-slate-700">Description</label>
                            <textarea id="description" rows="3" class="mt-1 block w-full rounded-md border-slate-300 shadow-sm"></textarea>
                        </div>
                        <div>
                            <label for="coordinator" class="block text-sm font-medium text-slate-700">Permit Co-ordinator *</label>
                             <select id="coordinator" required class="mt-1 block w-full rounded-md border-slate-300 shadow-sm">
                               ${MOCK_DB.users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                            </select>
                        </div>
                         <div>
                            <label for="sop" class="block text-sm font-medium text-slate-700">SOP</label>
                            <input type="text" id="sop" class="mt-1 block w-full rounded-md border-slate-300 shadow-sm">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">LOTO Applicable</label>
                        <div id="loto-toggle" class="flex rounded-md shadow-sm">
                            <button type="button" data-value="true" class="loto-btn relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Applicable</button>
                            <button type="button" data-value="false" class="loto-btn -ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Not Applicable</button>
                        </div>
                        <div id="loto-assets-section" class="hidden mt-4 space-y-4">
                            <h4 class="text-md font-semibold text-slate-800">LOTO Assets</h4>
                            <div id="loto-assets-container"></div>
                            <button type="button" id="add-loto-asset-btn" class="btn text-sm text-sky-600 font-semibold hover:text-sky-800 flex items-center gap-1">
                                 <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                                Add Asset
                            </button>
                        </div>
                    </div>
                    <div class="flex justify-end gap-4 pt-6 border-t">
                        <button type="button" onclick="navigate('dashboard')" class="btn bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-md font-medium text-sm">Cancel</button>
                        <button type="button" id="save-draft-btn" class="btn bg-slate-600 text-white px-6 py-2 rounded-md font-medium text-sm">Save Draft</button>
                        <button type="submit" class="btn bg-sky-600 text-white px-8 py-2 rounded-md font-semibold text-sm">Submit</button>
                    </div>
                </form>
            </div>
        `;
        setupCreatePermitFormLogic();
    }

    function setupCreatePermitFormLogic() {
        let lotoApplicable = false;
        const lotoToggle = getEl('loto-toggle');
        const lotoAssetsSection = getEl('loto-assets-section');
        const lotoAssetsContainer = getEl('loto-assets-container');
        const addLotoAssetBtn = getEl('add-loto-asset-btn');

        lotoToggle.querySelectorAll('.loto-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                lotoToggle.querySelectorAll('.loto-btn').forEach(b => b.classList.remove('bg-sky-600', 'text-white'));
                btn.classList.add('bg-sky-600', 'text-white');
                lotoApplicable = btn.dataset.value === 'true';
                lotoAssetsSection.classList.toggle('hidden', !lotoApplicable);
            });
        });
        lotoToggle.querySelector('[data-value="false"]').click();

        const addLotoAssetRow = () => {
            const index = lotoAssetsContainer.children.length;
            const div = document.createElement('div');
            div.className = 'p-3 bg-slate-50 rounded-md border grid grid-cols-2 md:grid-cols-5 gap-4';
            div.innerHTML = `
                <div class="col-span-2">
                    <label class="block text-xs font-medium text-slate-600">Procedure</label>
                    <input type="text" data-prop="procedure" class="loto-asset-input mt-1 block w-full rounded-md border-slate-300 text-sm">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-600">Asset Name</label>
                    <input type="text" data-prop="assetName" class="loto-asset-input mt-1 block w-full rounded-md border-slate-300 text-sm">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-600">Asset ID</label>
                    <input type="text" data-prop="assetId" class="loto-asset-input mt-1 block w-full rounded-md border-slate-300 text-sm">
                </div>
                 <div class="flex items-end">
                    <button type="button" class="remove-loto-asset-btn p-2 text-slate-400 hover:text-red-500"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                </div>
            `;
            lotoAssetsContainer.appendChild(div);
            div.querySelector('.remove-loto-asset-btn').onclick = () => {
                div.remove();
            };
        };
        addLotoAssetBtn.onclick = addLotoAssetRow;

        const form = getEl('create-permit-form');
        form.onsubmit = (e) => {
            e.preventDefault();
            submitNewPermit('Pending Approval', lotoApplicable);
        };
        getEl('save-draft-btn').onclick = () => {
            submitNewPermit('Draft', lotoApplicable);
        };
    }

    function submitNewPermit(status, lotoApplicable) {
        const lotoAssets = [];
        if (lotoApplicable) {
            getEl('loto-assets-container').querySelectorAll('.loto-asset-input').forEach(input => {
                const row = input.closest('.grid');
                const asset = {};
                row.querySelectorAll('.loto-asset-input').forEach(i => {
                    asset[i.dataset.prop] = i.value;
                });
                // Avoid duplicates
                if (!lotoAssets.some(a => a.assetId === asset.assetId)) {
                    lotoAssets.push(asset);
                }
            });
        }

        const newPermit = {
            id: MOCK_DB.permits.length + 10,
            number: `PTW-2025-0${Math.floor(Math.random() * 90) + 10}`,
            name: getEl('permitName').value,
            type: getEl('permitType').value,
            loc: getEl('location').value,
            contractor: getEl('contractor').value,
            startDate: `${getEl('startDate').value}T${getEl('startTime').value}`,
            endDate: `${getEl('endDate').value}T${getEl('endTime').value}`,
            ewpTemplateId: 'TPL-HW-01', // Default for simplicity
            approvalTemplateId: 'APP-STD-01', // Default for simplicity
            coordinatorId: getEl('coordinator').value,
            status: status,
            loto: { required: lotoApplicable, assets: lotoAssets },
            data: {},
            checklists: { pre: {}, post: {} }
        };

        MOCK_DB.permits.unshift(newPermit);
        if (status === 'Pending Approval') {
            MOCK_DB.authorizations[newPermit.id] = [{ role: 'Requestor', userId: AppState.currentUser.id, date: new Date().toISOString().replace('T', ' ').substring(0, 19) }];
        }

        showModal(`<div class="p-6 text-center"><h3 class="text-lg font-semibold text-slate-900">Success</h3><p class="mt-2 text-sm text-slate-500">Permit ${newPermit.number} has been successfully ${status === 'Draft' ? 'saved as a draft' : 'submitted'}.</p><button onclick="hideModal(); navigate('dashboard');" class="mt-4 btn bg-sky-600 text-white px-6 py-2 rounded-md">OK</button></div>`);
    }


    // --- PERMIT DETAILS RENDERING ---
    function renderPermitDetails(permitId) {
        const view = Views['permit-details'];
        const permit = MOCK_DB.permits.find(p => p.id === permitId);
        if (!permit) {
            view.innerHTML = `<p>Permit not found.</p>`;
            return;
        }
        AppState.activeTab = 'basic-details'; // Reset to default tab

        view.innerHTML = `
            <div id="permit-details-card" class="bg-white rounded-xl shadow-lg border border-slate-200/80">
                <!-- Permit Header -->
                <div class="p-6 border-b border-slate-200">
                    <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                             <button onclick="navigate('dashboard')" class="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors">
                                <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                                Back to Dashboard
                            </button>
                            <h2 class="text-2xl font-bold text-slate-900">${permit.number}: ${permit.name}</h2>
                        </div>
                        <div id="permit-actions-container" class="flex items-center gap-3 flex-shrink-0"></div>
                    </div>
                </div>

                <!-- Status Stepper -->
                <div id="status-stepper-container" class="p-6 border-b border-slate-200 overflow-x-auto"></div>

                <!-- Tab Navigation -->
                <div class="px-6 border-b border-slate-200">
                    <nav id="tab-nav-container" class="-mb-px flex space-x-6" aria-label="Tabs"></nav>
                </div>

                <!-- Tab Content Area -->
                <div class="p-6 md:p-8">
                    <div id="basic-details-tab" class="tab-content"></div>
                    <div id="permit-fields-tab" class="tab-content"></div>
                    <div id="worker-details-tab" class="tab-content"></div>
                    <div id="authorization-tab" class="tab-content"></div>
                    <div id="checklists-tab" class="tab-content"></div>
                    <div id="loto-tab" class="tab-content"></div>
                </div>
            </div>
        `;

        renderPermitActions(permit);
        renderStatusStepper(permit);
        renderTabs(permit);
        renderTabContent(permit);
    }

    function renderPermitActions(permit) {
        const container = getEl('permit-actions-container');
        const currentUser = AppState.currentUser;
        const isIssuer = currentUser.roles.includes('Issuer');
        let buttons = '';

        const isPreWorkComplete = areChecklistsComplete(permit, 'pre') && areFieldsComplete(permit);

        if (permit.status === 'Approved' && isIssuer) {
            if (!isPreWorkComplete) {
                buttons += `<div class="text-xs text-amber-600 bg-amber-100 p-2 rounded-md">Pre-work checklists & fields must be completed to issue.</div>`;
            }
            buttons += `<button onclick="updatePermitStatus(${permit.id}, 'Issued')" ${!isPreWorkComplete ? 'disabled' : ''} class="btn bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 text-sm disabled:bg-slate-300 disabled:cursor-not-allowed">Issue Permit</button>`;
        } else if (permit.status === 'Issued' && isIssuer) {
            buttons += `<button onclick="updatePermitStatus(${permit.id}, 'Active')" class="btn bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 text-sm">Start Work</button>`;
        } else if (permit.status === 'Active' && isIssuer) {
            buttons += `<button onclick="updatePermitStatus(${permit.id}, 'Work Stopped')" class="btn bg-amber-500 text-white px-4 py-2 rounded-md font-medium hover:bg-amber-600 text-sm">Stop Work</button>`;
        } else if (permit.status === 'Work Stopped' && isIssuer) {
            buttons += `<button onclick="updatePermitStatus(${permit.id}, 'Active')" class="btn bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 text-sm">Resume Work</button>`;
        }
        
        container.innerHTML = buttons;
    }

    function renderStatusStepper(permit) {
        const statuses = ['Pending Approval', 'Approved', 'Issued', 'Active', 'Work Stopped', 'Closed'];
        const container = getEl('status-stepper-container');
        let currentStatusIndex = statuses.indexOf(permit.status);
        
        container.innerHTML = `
            <div class="flex items-center">
                ${statuses.map((status, index) => {
                    let stateClass = 'status-step-pending';
                    if (index < currentStatusIndex) stateClass = 'status-step-complete';
                    else if (index === currentStatusIndex) stateClass = 'status-step-active';

                    const icon = index < currentStatusIndex 
                        ? `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>`
                        : index + 1;

                    return `
                    <div class="status-step flex-1 flex items-center ${stateClass} min-w-[120px]">
                        <div class="step-circle w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border-2">${icon}</div>
                        <span class="step-label text-sm ml-3 whitespace-nowrap">${status}</span>
                        ${index < statuses.length - 1 ? '<div class="step-line h-0.5 flex-1 mx-4"></div>' : ''}
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderTabs(permit) {
        const nav = getEl('tab-nav-container');
        const availableTabs = ['basic-details', 'permit-fields', 'worker-details', 'authorization', 'checklists'];
        if (permit.loto.required) availableTabs.push('loto');

        nav.innerHTML = availableTabs.map(tabId => {
            const name = tabId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `<a href="#" onclick="event.preventDefault(); switchTab('${tabId}')" class="tab-btn whitespace-nowrap py-3 px-2 rounded-t-lg border-b-2 font-semibold text-sm ${AppState.activeTab === tabId ? 'active' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}">${name}</a>`;
        }).join('');
    }

    function switchTab(tabName) {
        AppState.activeTab = tabName;
        const permit = MOCK_DB.permits.find(p => p.id === AppState.activePermitId);
        renderTabs(permit);
        renderTabContent(permit);
    }

    function renderTabContent(permit) {
        ['basic-details-tab', 'permit-fields-tab', 'worker-details-tab', 'authorization-tab', 'checklists-tab', 'loto-tab'].forEach(id => {
            const el = getEl(id);
            if (el) el.classList.remove('active');
        });

        const activeContentEl = getEl(`${AppState.activeTab}-tab`);
        if (!activeContentEl) return;

        switch(AppState.activeTab) {
            case 'basic-details': activeContentEl.innerHTML = renderBasicDetailsContent(permit); break;
            case 'permit-fields': activeContentEl.innerHTML = renderPermitFieldsContent(permit); break;
            case 'worker-details': renderWorkerDetailsContent(permit); break;
            case 'authorization': activeContentEl.innerHTML = renderAuthorizationContent(permit); break;
            case 'checklists': activeContentEl.innerHTML = renderChecklistsContent(permit); break;
            case 'loto': if (permit.loto.required) { activeContentEl.innerHTML = `LOTO Content`; } break;
        }
        activeContentEl.classList.add('active');
    }

    function renderBasicDetailsContent(permit) {
        const coordinator = MOCK_DB.users.find(u => u.id === permit.coordinatorId);
        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-slate-500">Permit Type</label>
                        <p class="mt-1 text-base font-semibold text-slate-800">${permit.type}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-500">Location</label>
                        <p class="mt-1 text-base font-semibold text-slate-800">${permit.loc}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-500">Contractor</label>
                        <p class="mt-1 text-base font-semibold text-slate-800">${permit.contractor}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-500">Coordinator</label>
                        <p class="mt-1 text-base font-semibold text-slate-800">${coordinator ? coordinator.name : 'N/A'}</p>
                    </div>
                    <div class="sm:col-span-2">
                        <label class="block text-sm font-medium text-slate-500">Work Description</label>
                        <p class="mt-1 text-base text-slate-800">${permit.name}</p>
                    </div>
                </div>
                <div class="bg-slate-50 p-4 rounded-lg border">
                    <h4 class="font-semibold text-slate-800 mb-3">Validity Period</h4>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs font-medium text-slate-500">Start</label>
                            <p class="text-sm font-medium text-slate-700">${new Date(permit.startDate).toLocaleString()}</p>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-500">End</label>
                            <p class="text-sm font-medium text-slate-700">${new Date(permit.endDate).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderPermitFieldsContent(permit) {
        const template = MOCK_DB.ewpTemplates.find(t => t.id === permit.ewpTemplateId);
        if (!template || template.fields.length === 0) {
            return `<div class="text-center py-12"><p class="text-slate-500">No custom fields for this permit type.</p></div>`;
        }

        return `
            <h3 class="text-xl font-bold text-slate-800 mb-4">${template.name} Fields</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${template.fields.map(field => {
                    const value = permit.data[field.id] || '';
                    let inputHtml = '';
                    switch(field.type) {
                        case 'Boolean':
                            inputHtml = `
                                <select class="permit-field-input mt-1 block w-full rounded-md border-slate-300" data-field-id="${field.id}">
                                    <option value="" ${value === '' ? 'selected' : ''}>Select...</option>
                                    <option value="true" ${String(value) === 'true' ? 'selected' : ''}>Yes</option>
                                    <option value="false" ${String(value) === 'false' ? 'selected' : ''}>No</option>
                                </select>
                            `;
                            break;
                        case 'Dropdown':
                             inputHtml = `
                                <select class="permit-field-input mt-1 block w-full rounded-md border-slate-300" data-field-id="${field.id}">
                                    <option value="">Select...</option>
                                    ${field.options.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                                </select>
                            `;
                            break;
                        case 'Multiline Text':
                            inputHtml = `<textarea rows="3" class="permit-field-input mt-1 block w-full rounded-md border-slate-300" data-field-id="${field.id}">${value}</textarea>`;
                            break;
                        default:
                            inputHtml = `<input type="text" class="permit-field-input mt-1 block w-full rounded-md border-slate-300" value="${value}" data-field-id="${field.id}">`;
                    }
                    return `
                        <div>
                            <label class="block text-sm font-medium text-slate-700">${field.name}${field.required ? ' *' : ''}</label>
                            ${inputHtml}
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="mt-6 text-right">
                <button onclick="savePermitFields(${permit.id})" class="btn bg-sky-600 text-white px-6 py-2 rounded-md font-semibold text-sm">Save Changes</button>
            </div>
        `;
    }

    function savePermitFields(permitId) {
        const permit = MOCK_DB.permits.find(p => p.id === permitId);
        if (!permit) return;

        document.querySelectorAll('.permit-field-input').forEach(input => {
            const fieldId = input.dataset.fieldId;
            permit.data[fieldId] = input.value;
        });
        
        showModal(`<div class="p-6 text-center"><h3 class="text-lg font-semibold text-slate-900">Success</h3><p class="mt-2 text-sm text-slate-500">Permit fields have been saved.</p><button onclick="hideModal()" class="mt-4 btn bg-sky-600 text-white px-6 py-2 rounded-md">OK</button></div>`);
        renderPermitActions(permit); // Re-render actions in case completion status changed
    }

    function renderWorkerDetailsContent(permit) {
        const container = getEl('worker-details-tab');
        const workers = MOCK_DB.workers[permit.id] || [];

        container.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-slate-800">Worker Details</h3>
                <button onclick="renderWorkerForm(${permit.id})" class="btn bg-sky-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm hover:bg-sky-700">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                    Add Worker
                </button>
            </div>
            <div class="bg-white rounded-lg shadow-md border overflow-hidden">
                <table class="min-w-full divide-y divide-slate-200">
                    <thead class="bg-slate-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Task</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID Proof</th>
                            <th scope="col" class="relative px-6 py-3"><span class="sr-only">Edit</span></th>
                        </tr>
                    </thead>
                    <tbody id="worker-table-body" class="bg-white divide-y divide-slate-200">
                        ${workers.length > 0 ? workers.map(w => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${w.name}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${w.task}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${w.contact}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${w.proof}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onclick="deleteWorker(${permit.id}, '${w.id}')" class="text-red-600 hover:text-red-900">Remove</button>
                                </td>
                            </tr>
                        `).join('') : `<tr><td colspan="5" class="text-center py-12 text-slate-500">No workers assigned to this permit.</td></tr>`}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderWorkerForm(permitId) {
        const formHtml = `
            <form id="worker-form" class="p-8 space-y-6">
                <h3 class="text-xl font-bold text-slate-900">Add Worker</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label for="workerName" class="block text-sm font-medium text-slate-700">Full Name</label>
                        <input type="text" id="workerName" required class="mt-1 block w-full rounded-md border-slate-300">
                    </div>
                    <div>
                        <label for="workerTask" class="block text-sm font-medium text-slate-700">Assigned Task</label>
                        <input type="text" id="workerTask" required class="mt-1 block w-full rounded-md border-slate-300">
                    </div>
                    <div>
                        <label for="workerContact" class="block text-sm font-medium text-slate-700">Contact Info</label>
                        <input type="text" id="workerContact" required class="mt-1 block w-full rounded-md border-slate-300">
                    </div>
                    <div>
                        <label for="workerProof" class="block text-sm font-medium text-slate-700">ID Proof</label>
                        <input type="text" id="workerProof" required class="mt-1 block w-full rounded-md border-slate-300" value="Company ID">
                    </div>
                </div>
                <div class="flex justify-end gap-4 pt-6 border-t">
                    <button type="button" onclick="hideModal()" class="btn bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-md font-medium text-sm">Cancel</button>
                    <button type="submit" class="btn bg-sky-600 text-white px-8 py-2 rounded-md font-semibold text-sm">Add Worker</button>
                </div>
            </form>
        `;
        showModal(formHtml);

        getEl('worker-form').onsubmit = (e) => {
            e.preventDefault();
            const newWorker = {
                id: `W-${Date.now()}`,
                name: getEl('workerName').value,
                task: getEl('workerTask').value,
                contact: getEl('workerContact').value,
                proof: getEl('workerProof').value,
            };
            if (!MOCK_DB.workers[permitId]) {
                MOCK_DB.workers[permitId] = [];
            }
            MOCK_DB.workers[permitId].push(newWorker);
            hideModal();
            renderWorkerDetailsContent(MOCK_DB.permits.find(p => p.id === permitId));
        };
    }
    
    function deleteWorker(permitId, workerId) {
        showConfirmation('Remove Worker?', 'Are you sure you want to remove this worker from the permit?', () => {
            const workers = MOCK_DB.workers[permitId];
            if (workers) {
                const index = workers.findIndex(w => w.id === workerId);
                if (index > -1) {
                    workers.splice(index, 1);
                }
            }
            hideModal();
            renderWorkerDetailsContent(MOCK_DB.permits.find(p => p.id === permitId));
        });
    }

    function renderAuthorizationContent(permit) {
        const approvalTemplate = MOCK_DB.approvalTemplates.find(t => t.id === permit.approvalTemplateId);
        const authorizations = MOCK_DB.authorizations[permit.id] || [];
        const currentUser = AppState.currentUser;

        if (!approvalTemplate) return 'No approval template found.';

        return `
            <h3 class="text-xl font-bold text-slate-800 mb-4">Authorization Workflow</h3>
            <div class="space-y-4">
                ${approvalTemplate.roles.map(role => {
                    const auth = authorizations.find(a => a.role === role.name);
                    const user = auth ? MOCK_DB.users.find(u => u.id === auth.userId) : null;
                    const canSign = !auth && currentUser.roles.includes(role.name);
                    
                    let statusHtml;
                    if (auth) {
                        statusHtml = `
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <p class="font-semibold text-slate-800">${user ? user.name : 'Unknown User'}</p>
                                    <p class="text-sm text-slate-500">Signed on ${new Date(auth.date).toLocaleString()}</p>
                                </div>
                            </div>
                        `;
                    } else if (canSign) {
                        statusHtml = `<button onclick="signPermit(${permit.id}, '${role.name}')" class="btn bg-sky-600 text-white px-5 py-2 rounded-lg font-semibold text-sm">Sign as ${role.name}</button>`;
                    } else {
                        statusHtml = `<div class="text-sm text-slate-500 font-medium">Pending Signature</div>`;
                    }

                    return `
                        <div class="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                            <div>
                                <h4 class="font-bold text-slate-900">${role.name}</h4>
                                <p class="text-sm text-slate-600">Suggested: ${role.suggestedUsers.map(uid => MOCK_DB.users.find(u=>u.id===uid).name).join(', ')}</p>
                            </div>
                            <div class="flex-shrink-0">
                                ${statusHtml}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function signPermit(permitId, roleName) {
        const permit = MOCK_DB.permits.find(p => p.id === permitId);
        if (!permit) return;

        if (!MOCK_DB.authorizations[permitId]) {
            MOCK_DB.authorizations[permitId] = [];
        }
        MOCK_DB.authorizations[permitId].push({
            role: roleName,
            userId: AppState.currentUser.id,
            date: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });

        // Check if all roles are signed to auto-approve
        const approvalTemplate = MOCK_DB.approvalTemplates.find(t => t.id === permit.approvalTemplateId);
        if (approvalTemplate && MOCK_DB.authorizations[permitId].length === approvalTemplate.roles.length) {
            permit.status = 'Approved';
        }

        renderTabContent(permit);
        renderStatusStepper(permit);
        renderPermitActions(permit);
    }

    function renderChecklistsContent(permit) {
        const template = MOCK_DB.ewpTemplates.find(t => t.id === permit.ewpTemplateId);
        if (!template) return 'No EWP template found.';

        const renderList = (type, items) => {
            if (!items || items.length === 0) return `<p class="text-slate-500">No ${type} checklist items.</p>`;
            return `
                <ul class="space-y-3">
                    ${items.map((item, index) => {
                        const isChecked = permit.checklists[type][index] === true;
                        return `
                            <li>
                                <label class="flex items-center p-3 bg-slate-50 rounded-md border hover:bg-slate-100 transition-colors">
                                    <input type="checkbox" onchange="updateChecklistItem(${permit.id}, '${type}', ${index}, this.checked)" class="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500" ${isChecked ? 'checked' : ''}>
                                    <span class="ml-3 text-sm font-medium text-slate-800">${item}</span>
                                </label>
                            </li>
                        `;
                    }).join('')}
                </ul>
            `;
        };

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 class="text-xl font-bold text-slate-800 mb-4">Pre-Work Checklist</h3>
                    ${renderList('pre', template.preWorkChecklist)}
                </div>
                <div>
                    <h3 class="text-xl font-bold text-slate-800 mb-4">Post-Work Checklist</h3>
                    ${renderList('post', template.postWorkChecklist)}
                </div>
            </div>
        `;
    }
    
    window.updateChecklistItem = (permitId, type, index, isChecked) => {
        const permit = MOCK_DB.permits.find(p => p.id === permitId);
        if (permit) {
            if (!permit.checklists[type]) permit.checklists[type] = {};
            permit.checklists[type][index] = isChecked;
            renderPermitActions(permit); // Re-render actions in case completion status changed
        }
    };

    function areChecklistsComplete(permit, type) {
        const template = MOCK_DB.ewpTemplates.find(t => t.id === permit.ewpTemplateId);
        if (!template || !template.preWorkChecklist) return true; // No checklist = complete
        
        const checklistItems = type === 'pre' ? template.preWorkChecklist : template.postWorkChecklist;
        if (!checklistItems || checklistItems.length === 0) return true;

        for (let i = 0; i < checklistItems.length; i++) {
            if (permit.checklists[type]?.[i] !== true) {
                return false;
            }
        }
        return true;
    }

    function areFieldsComplete(permit) {
        const template = MOCK_DB.ewpTemplates.find(t => t.id === permit.ewpTemplateId);
        if (!template) return false;
        return template.fields.every(field => {
            if (!field.required) return true;
            const value = permit.data[field.id];
            return value !== undefined && value !== null && value !== '';
        });
    }

    function updatePermitStatus(permitId, newStatus) {
        const permit = MOCK_DB.permits.find(p => p.id === permitId);
        if (permit) {
            permit.status = newStatus;
            navigate('permit-details', permitId);
        }
    }

    // --- INITIALIZATION ---
    document.addEventListener('DOMContentLoaded', () => {
        // Setup navigation and user switcher
        getEl('nav-dashboard').onclick = (e) => { e.preventDefault(); navigate('dashboard'); };
        getEl('nav-templates').onclick = (e) => { e.preventDefault(); navigate('templates'); };

        const userSelector = getEl('user-role-selector');
        MOCK_DB.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} (${user.roles.join(', ')})`;
            userSelector.appendChild(option);
        });
        userSelector.onchange = (e) => switchUser(e.target.value);
        
        // Initial render of the application
        navigate('dashboard');
    });
})();
