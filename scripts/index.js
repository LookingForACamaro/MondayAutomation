const columnTypes = {
    TEXT: 'text',
    STATUS: 'color',
    MENU_DEROULANT: 'dropdown',
    DATE: 'date',
    PERSONNES: 'multiple-person',
    CHIFFRES: 'numeric'
}

class Board {
    constructor(id) {
        this.id = id;
    }

    async addUser(user) {
        try {
            return await xhrFetch(`/projects/${this.id}/subscribers`, 'POST', JSON.stringify({ "members": [user.id], "make_admin": false }));
        } catch (message) {
            return new Error(message);
        }
    }

    async addTeam(team) {
        try {
            return await xhrFetch(`/projects/${this.id}/teams/${team.id}/subscribe`, 'POST');
        } catch (message) {
            return new Error(message);
        }
    }

    async addGroup(group) {
        try {
            let result = await xhrFetch(`/boards/${this.id}/groups`, 'POST', JSON.stringify({ title: group.title })).then(res => res.json());
            for (let item of group.items) {
                await xhrFetch('/projects', 'POST', JSON.stringify({ "board_id": this.id, "group_id": result.id, "name": item, "column_values": { "name": item } }));
            }
        } catch (message) {
            return new Error(message);
        }
    }

    async setMute(shouldMute) {
        try {
            return await xhrFetch(`/notifications/update_mute_board_settings`, 'POST', JSON.stringify({ "boardId": this.id, "all": [{ "enabled": !shouldMute, "settingKinds": ["all"] }] }));
        } catch (message) {
            return new Error(message);
        }
    }

    async addColumn(column) {
        try {
            return await xhrFetch(`/boards/${this.id}/columns`, 'POST', JSON.stringify({ "type": column.type, "title": column.title, "defaults": { "settings": { "hide_footer": false } }, "options": { "after_column_id": null }, "subset_id": null }));
        } catch (message) {
            return new Error(message);
        }
    }

    async addUserOrTeamToLineOfGroupInColumn(userOrTeam, lineName, groupName, columnName) {
        let data = await this.getBoardData();
        let columns = data.board_data.columns.filter(column => column.title.toLowerCase() === columnName.toLowerCase());
        let groups = data.board_data.groups.filter(group => group.title.toLowerCase() === groupName.toLowerCase());
        if (columns.length === 1 && groups.length === 1) {
            let items = await xhrFetch(`/columnvalues/board-ms/boards/${this.id}/items`, 'POST', JSON.stringify({ "filterRules": null, "dynamicFilters": { "searchTerm": null, "personFilter": null }, "limit": 100, "caller": "webBoardApp", "callerAction": "resetBoard", "getFullBoardIfLessThanItemsCount": 700, "fetchParentBoardIfNeeded": true, "getFullBoardIfHaveAutoNumber": true, "shouldUseBoardMsFlow": true, "timeZoneOffset": 1 })).then(res => res.json())
            let pulses = items.pagedItems[groups[0].id].filter(item => item.name.toLowerCase() === lineName.toLowerCase());
            if (pulses.length === 1) {
                return await xhrFetch(`/boards/${this.id}/batch_change_column_value`, 'POST', JSON.stringify({ "pulseIds": [pulses[0].id], "columnId": columns[0].id, "columnValue": { "added_person_or_team": userOrTeam, "changed_at": new Date().toISOString() } }))
            }
        }
    }

    async getBoardData() {
        try {
            return await xhrFetch(`/boards/${this.id}/board_data?source=resetBoardAction&pulse_ids_only=true&skip_linked_boards=true&fetchParentBoardIfNeeded=true&can_board_data_extended=true`).then(res => res.json())
        } catch (message) {
            return new Error(message);
        }
    }
}

class Group {
    constructor(title, items) {
        this.title = title;
        this.items = items;
    }
}

class User {
    constructor(id) {
        this.id = id;
        this.kind = "person";
    }

    static async fromEmail(email) {
        try {
            let data = await xhrFetch(`/search/users_live?project_id=&without_guests=false&only_guests=false&with_teams=true&term=${email}`).then(res => res.json());
            if (data.results?.length === 1 && data.results[0].type.toLowerCase() === 'user' && data.results[0].name.toLowerCase() === email.toLowerCase()) {
                return new User(data.results[0].id)
            }
            return new Error("Too many / no User found");
        } catch (message) {
            return new Error(message);
        }
    }
}


class Team {
    constructor(id) {
        this.id = id;
        this.kind = "team";
    }

    static async fromName(name) {
        try {
            let data = await xhrFetch(`/search/users_live?project_id=&without_guests=false&only_guests=false&with_teams=true&term=${name}`).then(res => res.json());
            if (data.results?.length === 1 && data.results[0].type.toLowerCase() === 'team' && data.results[0].name.toLowerCase() === name.toLowerCase()) {
                return new Team(data.results[0].id)
            }
            return new Error("Too many / no Team found");
        } catch (message) {
            return new Error(message);
        }
    }
}

class Column {
    constructor(title, type) {
        this.title = title;
        this.type = type;
    }
}

function xhrFetch(url, method, body) {
    return fetch(url, {
        credentials: 'include',
        method: method || 'GET',
        body: body || null,
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Token': getCSRFToken()
        }
    })
}

function getCSRFToken() {
    return document.querySelector('[name=csrf-token]').content || null
}

function AreVariablesSet(){
    return true; // Mock
}

(function runController(){
    if(!AreVariablesSet()){
        showAddVariablesModal();
    }
    showMainModal();
})()