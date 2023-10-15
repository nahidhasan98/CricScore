const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const ByteArray = imports.byteArray;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Mainloop = imports.mainloop;

var indicator, label, timeout;

function _refresh() {
    let res = makeHttpGetRequest("https://www.cricbuzz.com/api/html/homepage-scag");
    label.set_text(res);
}

function enable() {
    indicator = new PanelMenu.Button(0.0, "CricScore", false);
    Main.panel.addToStatusArea("CricScore", indicator);

    label = new St.Label({
        text: 'CricScore',
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'panel-button',
        track_hover: false,
        reactive: false
    });

    indicator.actor.add_child(label);

    timeout = Mainloop.timeout_add(5000, function () {
        _refresh();
        return true;
    });
}

function disable() {
    Mainloop.source_remove(timeout);
    indicator.destroy();
    indicator = null;
    label = null;
    timeout = null;
}

function makeHttpGetRequest(url) {
    let [success, stdout, stderr] = GLib.spawn_command_line_sync(`curl ${url}`);

    if (success) {
        let data = ByteArray.toString(stdout);

        let teams = [];
        let scores = [];
        let match;

        const regexTeam = /class='text-normal'>(.*?)<\/span>/g;
        while ((match = regexTeam.exec(data)) !== null) {
            teams.push(match[1]);
            if (teams.length == 2) break;
        }

        const regexScore = /style='display:inline-block; width:100%'>(.*?)<\/div>/g;
        while ((match = regexScore.exec(data)) !== null) {
            scores.push(match[1]);
            if (scores.length == 2) break;
        }

        // console.log(teams);
        // console.log(scores);

        let res = "";
        res += teams[0];
        if (scores[0]) {
            res += ": " + scores[0];
        }
        res += " VS ";
        res += teams[1];
        if (scores[1]) {
            res += ": " + scores[1];
        }

        console.log(res);
        return res;
    } else {
        logError(`Error: ${ByteArray.toString(stderr)}`);
        return "CricScore";
    }
}
