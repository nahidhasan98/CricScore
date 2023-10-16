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

    timeout = Mainloop.timeout_add(10000, function () {
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

        // const regexScore = /style='display:inline-block; width:100%'>(.*?)<\/div>/g;
        let regexScore = new RegExp(`class='text-normal'>${teams[0]}<\/span><\/div><div class='cb-col-50 cb-ovr-flo' style='display:inline-block; width:100%'>(.*?)<\/div>`, "g");
        if ((match = regexScore.exec(data)) !== null) {
            scores.push(match[1]);
        }
        regexScore = new RegExp(`class='text-normal'>${teams[1]}<\/span><\/div><div class='cb-col-50 cb-ovr-flo' style='display:inline-block; width:100%'>(.*?)<\/div>`, "g");
        if ((match = regexScore.exec(data)) !== null) {
            scores.push(match[1]);
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

        // If the game not start yet
        if (scores.length == 0) {
            let regexp = /ng-bind="(\d+) \|date: 'EEEE, d MMM, hh:mm a'/;
            if ((match = regexp.exec(data)) !== null) {
                let time = match[1];
                time /= 1000;

                let date = new Date(time * 1000);
                const options = {
                    weekday: 'short',      // Abbreviated weekday name (e.g., 'Mon')
                    hour: '2-digit',       // Two-digit hour (e.g., '02')
                    minute: '2-digit',     // Two-digit minutes (e.g., '30')
                    hour12: true,          // Use 12-hour clock format (e.g., 'AM' or 'PM')
                };

                // Format the date
                const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

                res += " (" + formattedDate + ")";
            }
        }

        console.log(res);
        return res;
    } else {
        logError(`Error: ${ByteArray.toString(stderr)}`);
        return "CricScore";
    }
}
