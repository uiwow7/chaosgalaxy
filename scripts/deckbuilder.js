let search_results = [];
let card_list_arrayified = [];
let specialchars = "";
let deck = [];
let sideboard = [];
let active_card = [];
let sets_json = {};
const rootPath = '.';

document.addEventListener("DOMContentLoaded", async function () {
    await fetch(rootPath + '/resources/database.json')
        .then(response => response.json())
        .then(json => {
            card_list_arrayified = json;
        }).catch(error => console.error('Error:', error));

    await fetch(rootPath + '/resources/replacechars.txt')
        .then(response => response.text())
        .then(text => {
            specialchars = text; 
        }).catch(error => console.error('Error:', error));

    cardGrid = document.getElementById("imagesOnlyGrid");
    card_list_arrayified.sort(compareFunction);

    gridified_card = gridifyCard(card_list_arrayified[0], true);
    console.log(gridified_card);
    gridified_card.getElementsByTagName("img")[0].id = "image-grid-card";
    // gridified_card.getElementsByTagName("a")[0].removeAttribute("href");
    document.getElementById("card-grid-container").appendChild(gridified_card);

    // initial search on load
    preSearch();
});

function displayChangeListener() {
    preSearch();
}

document.getElementById("sort-by").onchange = displayChangeListener;
document.getElementById("sort-order").onchange = displayChangeListener;

document.getElementById("file-menu").addEventListener("change", function(event) {
    let option = document.getElementById("file-menu").value;

    if (option == "new")
    {
        deck = [];
        sideboard = [];
        processDeck();
        document.getElementById("file-menu").value = "default";
    }
    else if (option == "import")
    {
        document.getElementById("import-file").click();
    }
    else if (option == "import-clipboard")
    {
        importFromClipboard();
    }
    else if (option == "save")
    {
        saveDeck();
    }
    else if (option == "clipboard" || option.startsWith("export"))
    {
        exportFile(option);
    }
});

document.addEventListener("click", (event) => {
    if (!contextMenu.contains(event.target)) {
        contextMenu.style.display = "none";
    }
});

document.getElementById("add-to-deck").addEventListener("click", () => {
    addCardToDeck(active_card);
    contextMenu.style.display = "none";
});

document.getElementById("add-to-sideboard").addEventListener("click", () => {
    addCardToSideboard(active_card);
    contextMenu.style.display = "none";
});

document.getElementById("display-select").addEventListener("change", function(event) {
    processDeck();
});

document.getElementById("import-file").addEventListener("change", function(event) {
    const files = event.target.files;

    if (files.length > 0) {
        const file = files[0];
        const name = file.name.replace(/\.[^/.]+$/, "");
        const import_type = file.name.replace(/^[^/.]+\./, "");

        document.getElementById("deck-name").value = name;

        deck = [];
        sideboard = [];
        sb_cards = false;

        const reader = new FileReader();
        reader.onload = function(e) {
            const fileContent = e.target.result;

            const lines = fileContent.split('\n');
            if (import_type == 'dek')
            {
                for (const line of lines)
                {
                    if (line == 'sideboard' || line == '') // '' for Draftmancer files
                    {
                        sb_cards = true;
                    }
                    else
                    {
                        const count = line.substring(0, line.indexOf(' '));
                        const card = line.substring(line.indexOf(' ') + 1);

                        for (let i = 0; i < count; i++)
                        {
                            if (sb_cards)
                            {
                                addCardToSideboard(card);
                            }
                            else
                            {
                                addCardToDeck(card);
                            }
                        }						
                    }
                }
            }
            else if (import_type == 'txt')
            {
                let deck_map = new Map();
                let sb_map = new Map();

                for (const line of lines)
                {
                    if (line == 'sideboard' || line == '') // '' for Draftmancer files
                    {
                        sb_cards = true;
                    }
                    else if (!sb_cards)
                    {
                        count = parseInt(line.substring(0, line.indexOf(' ')));
                        card_name = line.substring(line.indexOf(' ') + 1);

                        if (deck_map.has(card_name))
                        {
                            deck_map.set(card_name, deck_map.get(card_name) + count);
                        }
                        else
                        {
                            deck_map.set(card_name, count);
                        }
                    }
                    else
                    {
                        count = parseInt(line.substring(0, line.indexOf(' ')));
                        card_name = line.substring(line.indexOf(' ') + 1);

                        if (sb_map.has(card_name))
                        {
                            sb_map.set(card_name, sb_map.get(card_name) + count);
                        }
                        else
                        {
                            sb_map.set(card_name, count);
                        }
                    }
                }
                for (const card of card_list_arrayified)
                {
                    if (deck_map.has(card.card_title))
                    {
                        for (let i = 0; i < deck_map.get(card.card_title); i++)
                        {
                            addCardToDeck(JSON.stringify(card));
                        }
                        deck_map.delete(card.card_title);
                    }

                    if (sb_map.has(card.card_title))
                    {
                        for (let i = 0; i < sb_map.get(card.card_title); i++)
                        {
                            addCardToSideboard(JSON.stringify(card));
                        }
                        sb_map.delete(card.card_title);
                    }
                }
            }
        };
        reader.readAsText(file);
    }

    document.getElementById("file-menu").value = "default";
});

function compareFunction(a, b) {
    const sortMode = document.getElementById("sort-by").value;
    
    if (sortMode == 'type') {
        // creature>resource>activator

        if (a.card_type == 'Planet' && b.card_type != 'Planet') {
            return -1;
        }
        if (b.card_type == 'Planet' && a.card_type != 'Planet') {
            return 1;
        }

        if (a.card_type == 'Creature' && b.card_type != 'Creature') {
            return -1;
        }
        if (b.card_type == 'Creature' && a.card_type != 'Creature') {
            return 1;
        }

        if (a.card_type == 'Combiner' && b.card_type != 'Combiner') {
            return -1;
        }
        if (b.card_type == 'Combiner' && a.card_type != 'Combiner') {
            return 1;
        }

        if (a.card_type.includes('Resource') && !b.card_type.includes('Resource')) {
            return -1;
        }

        if (b.card_type.includes('Resource') && !a.card_type.includes('Resource')) {
            return 1;
        }

        if (a.card_type == 'Attachment' && b.card_type != 'Attachment') {
            return -1;
        }
        if (b.card_type == 'Attachment' && a.card_type != 'Attachment') {
            return 1;
        }

        if (a.card_type == 'Moon' && b.card_type != 'Moon') {
            return -1;
        }
        if (b.card_type == 'Moon' && a.card_type != 'Moon') {
            return 1;
        }

        if (a.card_type == 'Activator' && b.card_type != 'Activator') {
            return -1;
        }
        if (b.card_type == 'Activator' && a.card_type != 'Activator') {
            return 1;
        }

        return 0;
    }

    if (sortMode == 'stars') {
        return a.Stars - b.Stars;
    }

    if (sortMode == 'name')
    {
        if (a.card_name === b.card_name)
        {
            return 0;
        }
        else {
            return (a.card_name < b.card_name) ? -1 : 1;
        }
	}

    if (sort_order == "planet") {
        if (a.Planet === b.Planet)
        {
            return 0;
        }
        else {
            return (a.Planet < b.Planet) ? -1 : 1;
        }
    }
}

function preSearch() {
    const searchTerms = document.getElementById("search").value.toLowerCase();
    const tokens = tokenizeTerms(searchTerms) || [];
    const sortBySelect = document.getElementById("sort-by");
    const sortOrderSelect = document.getElementById("sort-order");

    sortBySelect.disabled = false;
    sortOrderSelect.disabled = false;

    tokens.forEach(token => {
        if (token.startsWith("sort:")) {
            const val = token.substring(5);
            const map = {
                "name": "name",
                "set": "set-code",
                "mv": "mv",
                "color": "color",
                "rarity": "rarity",
                "cube": "cube"
            };
            if (map[val]) {
                const option = Array.from(sortBySelect.options).find(opt => opt.value === map[val]);
                if (option) {
                    sortBySelect.value = map[val];
                    sortBySelect.disabled = true;
                }
            }
        }
        if (token.startsWith("direction:")) {
            const val = token.substring(10);
            const map = {
                "asc": "ascending",
                "desc": "descending"
            };
            if (map[val]) {
                const option = Array.from(sortOrderSelect.options).find(opt => opt.value === map[val]);
                if (option) {
                    sortOrderSelect.value = map[val];
                    sortOrderSelect.disabled = true;
                }
            }
        }
    });

    card_list_arrayified.sort(compareFunction);
    if (document.getElementById("sort-order").value == "descending")
    {
        card_list_arrayified.reverse();
    }
    search_results = [];

    search();
}

function search() {
    searchTerms = document.getElementById("search").value.toLowerCase();

    cardGrid = document.getElementById("imagesOnlyGrid");
    cardGrid.innerHTML = "";

    for (const card of card_list_arrayified) {
        searched = searchAllTokens(card, tokenizeTerms(searchTerms));

        if (searched)
        {
            search_results.push(card);
        }
    }

    for (let i = 0; i < search_results.length; i++)
    {
        const imgContainer = document.createElement("div");
        const card_stats = search_results[i];
        const id = card_stats.set + "-" + card_stats.number + "-" + document.getElementById("display").value;
        imgContainer.className = "img-container";
        const card_sr_grid = gridifyCard(search_results[i], true, true);
        const card_sr = card_sr_grid.getElementsByTagName("img")[0];

        card_sr.onmouseover = function() {
            cgc = document.getElementById("card-grid-container");
            cgc.innerHTML = "";
            const gridified_card = gridifyCard(card_stats, true);
            // gridified_card.getElementsByTagName("img")[0].id = "image-grid-card";
            cgc.appendChild(gridified_card);
        };

        card_sr.onclick = function() {
            addCardToDeck(JSON.stringify(card_stats));
        }
        card_sr.style.cursor = "pointer";

        contextMenu = document.getElementById("myContextMenu");
        card_sr.addEventListener("contextmenu", (event) => {
            event.preventDefault(); // Prevent default context menu

            contextMenu.style.display = "block";
            contextMenu.style.left = event.pageX + "px";
            contextMenu.style.top = event.pageY + "px";

            active_card = JSON.stringify(card_stats);
        });

        imgContainer.appendChild(card_sr);
        cardGrid.appendChild(imgContainer);
    }
}

function tokenizeTerms(searchTerms)
{
    let tokenRegex = /-?\w*[!:<>=]?(([^ "\(\)\/“”]+)|(\".+?\")|(\(.+?\))|(\/.+?\/)|(\“.+?\”))/g;
    let searchTokens = searchTerms.match(tokenRegex);

    return searchTokens;
}

function searchAllTokens(card, tokens)
{
    if (tokens == null || tokens == '')
    {
        return true;
    }

    tokens = tokens.filter(t => !t.startsWith("sort:") && !t.startsWith("direction:"));
    if (tokens.length == 0)
    {
        return true;
    }

    for (let i = 0; i < tokens.length; i++)
    {
        if (tokens[i].charAt(0) == '+')
        {
            return searchAllTokens(card, tokens.slice(0, i)) && searchAllTokens(card, tokens.slice(i + 1));
        }
        if (tokens[i] == "or")
        {
            return searchAllTokens(card, tokens.slice(0, i)) || searchAllTokens(card, tokens.slice(i + 1));
        }
    }

    for (let token of tokens)
    {
        if (token.charAt(0) == '-')
        {
            return !searchToken(card, token.substring(1)) && (tokens.length == 1 ? true : searchAllTokens(card, tokens.slice(1)));
        }
        if (token.charAt(0) == '(')
        {
            return searchAllTokens(card, tokenizeTerms(token.substring(1, token.length - 1))) && (tokens.length == 1 ? true : searchAllTokens(card, tokens.slice(1)));
        }
        else
        {
            return searchToken(card, token) && (tokens.length == 1 ? true : searchAllTokens(card, tokens.slice(1)));
        }
    }
}

function removeDuplicateChars(str)
{
    let ret_str = '';

    for (const c of str)
    {
        if (!ret_str.includes(c))
        {
            ret_str += c;
        }
    }

    return ret_str;
}

function convertToMV(cost)
{
    let mv = 0;
    
    costTokens = cost.substring(1, cost.length - 1).replaceAll("}{"," ").split(' ');
    for (const token of costTokens)
    {
        if (isDecimal(token))
        {
            mv += parseInt(token);
        }
        // 2brid
        else if (token.includes('2'))
        {
            mv += 2;
        }
        else if (token != "x" && token != "")
        {
            mv += 1;
        }
    }

    return mv;
}

function searchToken(card, token)
{
    let card_stats = [];

    for (var key in card)
    {
        if (isNaN(card[key]))
        {
            card_stats[key] = card[key].toLowerCase();
        }
        else
        {
            card_stats[key] = card[key];
        }
    }

    let card_name = card_stats.card_title;
    let card_color = card_stats.color;
    let card_rarity = card_stats.rarity;
    let card_type = card_stats.type;
    // 4: collector number
    let card_ci = removeDuplicateChars(card_stats.color_identity);
    let card_cost = card_stats.cost;
    let card_mv = convertToMV(card_cost);
    //Strip out the lingering [i][/i] and [b][/b] tags while we're searching just in case someone decided to bold something in the
    //middle of their rules text for some reason
    let card_oracle_text = card_stats.rules_text != "" ? card_stats.rules_text.replace(/\[(\/)?([ib])\]/g, "") : card_stats.special_text.replace(/\[(\/)?([ib])\]/g, "");
    let card_power = card_stats.pt.substring(0,card_stats.pt.indexOf('/'));
    let card_toughness = card_stats.pt.substring(card_stats.pt.indexOf('/')+1);
    let card_shape = card_stats.shape;
    let card_set = card_stats.set;
    let card_loyalty = card_stats.loyalty;
    let card_notes = card_stats.notes;
    let card_artist = card_stats.artist;
    let card_alias = card_stats.alias ? card_stats.alias : ""; // do this so that we have backwards compatibility
    let card_ft = card_stats.flavor_text ? card_stats.flavor_text : "";
    let card_color_2 = "";
    let card_cost_2 = "";
    let card_power_2 = "";
    let card_toughness_2 = "";
    let card_loyalty_2 = "";

    let color_map = new Map([
        ["azorius", "wu"],
        ["dimir", "ub"],
        ["rakdos", "br"],
        ["gruul", "rg"],
        ["selesnya", "gw"],
        ["orzhov", "wb"],
        ["golgari", "bg"],
        ["simic", "gu"],
        ["izzet", "ur"],
        ["boros", "rw"],
        ["esper", "wub"],
        ["grixis", "ubr"],
        ["jund", "brg"],
        ["naya", "rgw"],
        ["bant", "gwu"],
        ["abzan", "wbg"],
        ["sultai", "bgu"],
        ["temur", "gur"],
        ["jeskai", "urw"],
        ["mardu", "rwb"],
    ]);

    // two cards in one
    if (card_shape.includes("adventure") || card_shape.includes("double") || card_shape.includes("spli"))
    {
        card_name = card_name + "	" + card_stats.card_title2;
        card_type = card_type + "	" + card_stats.type2;
        card_oracle_text = card_oracle_text + "	" + (card_stats.rules_text2 != "" ? card_stats.rules_text2.replace(/\[(\/)?([ib])\]/g, "") : card_stats.special_text2.replace(/\[(\/)?([ib])\]/g, ""));
        if (card_stats.flavor_text2)
        {
            card_ft = card_ft + "\n" + card_stats.flavor_text2;
        }
        card_color_2 = card_stats.color2;
        card_cost_2 = card_stats.cost2;
        card_power_2 = card_stats.pt2.substring(0,card_stats.pt2.indexOf('/'));
        card_toughness_2 = card_stats.pt.substring(card_stats.pt.indexOf('/')+1);
        card_loyalty_2 = card_stats.loyalty2;
    }

    token = token.replaceAll("~", card_name).replaceAll("cardname", card_name).replaceAll('"','').replaceAll('“','').replaceAll('”','');

    const modifierRegex = /[!:<>=][=]*/g;
    const match = token.match(modifierRegex);

    if (match)
    {
        const modifier = match[0];
        const term = token.substring(0, token.indexOf(modifier));
        let check = token.substring(token.indexOf(modifier) + modifier.length);

        // availableTokens = ["mv", "c", "ci", "t", "o", "pow", "tou", "r", "is"]

        /* template
        if (term == "mv")
        {
            if (modifier == "!" || modifier == "=")
            {

            }
            else if (modifier == ":")
            {

            }
            else if (modifier == "<")
            {

            }
            else if (modifier == ">")
            {

            }
        } */
        if (term == "mv" || term == "cmc")
        {
            if (modifier == "!" || modifier == "=")
            {
                return (card_mv == check);
            }
            else if (modifier == ":")
            {
                return (card_mv == check);
            }
            else if (modifier == "<")
            {
                return (card_mv < check);
            }
            else if (modifier == ">")
            {
                return (card_mv > check);
            }
            else if (modifier == "<=")
            {
                return (card_mv <= check);
            }
            else if (modifier == ">=")
            {
                return (card_mv >= check);
            }
        }
        if (term == "c" || term == "color")
        {
            if (color_map.has(check))
            {
                check = color_map.get(check);
            }
            if (!isNaN(check))
            {
                if (modifier == "!" || modifier == "=")
                {
                    return card_color.length == parseInt(check);
                }
                else if (modifier == ":")
                {
                    return card_color.length == parseInt(check);
                }
                else if (modifier == "<")
                {
                    return card_color.length < parseInt(check);
                }
                else if (modifier == ">")
                {
                    return card_color.length > parseInt(check);
                }
                else if (modifier == "<=")
                {
                    return card_color.length <= parseInt(check);
                }
                else if (modifier == ">=")
                {
                    return card_color.length >= parseInt(check);
                }
            }
            else
            {
                card_color = card_color == "" ? "c" : card_color;
                if (check == "m")
                {
                    if (modifier == "<")
                    {
                        return card_color.length < 2;
                    }
                    else
                    {
                        return card_color.length > 1;							
                    }
                }
                else if (modifier == "!" || modifier == "=")
                {
                    return (card_color.split("").sort().join("") == check.split("").sort().join(""));
                }
                else if (modifier == ":")
                {
                    return hasAllChars(card_color, check);
                }
                else if (modifier == "<")
                {
                    return card_color == "c" || (check.length > card_color.length && hasAllChars(check, card_color));
                }
                else if (modifier == ">")
                {
                    return card_color.length > check.length && hasAllChars(card_color, check);
                }
                else if (modifier == "<=")
                {
                    return card_color == "c" || hasAllChars(check, card_color);
                }
                else if (modifier == ">=")
                {
                    return hasAllChars(card_color, check);
                }
            }
        }
        if (term == "cost" || term == "mana")
        {
            if (color_map.has(check))
            {
                check = color_map.get(check);
            }
            if (modifier == "!" || modifier == "=" || modifier == ":")
            {
                card_cost_cleaned = card_cost.replaceAll('{', '').replaceAll('}', '');
                return check == card_cost || check == card_cost_cleaned;
            }
        }
        if (term == "ci" || term == "id")
        {
            if (color_map.has(check))
            {
                check = color_map.get(check);
            }
            if (!isNaN(check))
            {
                card_ci = card_ci == "c" ? "" : card_ci;
                if (modifier == "!" || modifier == "=")
                {
                    return card_ci.length == parseInt(check);
                }
                else if (modifier == ":")
                {
                    return card_ci.length == parseInt(check);
                }
                else if (modifier == "<")
                {
                    return card_ci.length < parseInt(check);
                }
                else if (modifier == ">")
                {
                    return card_ci.length > parseInt(check);
                }
                else if (modifier == "<=")
                {
                    return card_ci.length <= parseInt(check);
                }
                else if (modifier == ">=")
                {
                    return card_ci.length >= parseInt(check);
                }
            }
            else
            {
                if (modifier == "!" || modifier == "=")
                {
                    return (card_ci.split("").sort().join("") == check.split("").sort().join(""));
                }
                else if (modifier == "<")
                {
                    return card_ci == "c" || (check.length > card_ci.length && hasAllChars(check, card_ci));
                }
                else if (modifier == ">")
                {
                    return card_ci.length > check.length && hasAllChars(card_ci, check);
                }
                else if (modifier == ":" || modifier == "<=")
                {
                    return card_ci == "c" || hasAllChars(check, card_ci);
                }
                else if (modifier == ">=")
                {
                    return hasAllChars(card_ci, check);
                }
            }
        }
        if (term == "t" || term == "type")
        {
            if (modifier == ":")
            {
                regex = new RegExp("\\b" + check + "\\b");
                return regex.test(card_type);
            }
            /* unsupported flows
            if (modifier == "!" || modifier == "=")
            {

            }
            else if (modifier == "<")
            {

            }
            else if (modifier == ">")
            {

            } */
        }
        if (term == "o")
        {
            if (modifier == ":")
            {
                if (check.startsWith("/") && check.endsWith("/"))
                {
                    check = check.substring(1, check.length - 1);

                    regex = new RegExp(check.replaceAll("+","\\+"));
                    return regex.test(card_oracle_text);
                }
                else
                {
                    return card_oracle_text.includes(check);
                }
            }
            /* unsupported flows
            if (modifier == "!" || modifier == "=")
            {

            }
            else if (modifier == "<")
            {

            }
            else if (modifier == ">")
            {

            } */
        }
        if (term == "pow" || term == "power")
        {
            if (modifier == "!" || modifier == "=")
            {
                return (card_power == check);
            }
            else if (modifier == ":")
            {
                return (card_power == check);
            }
            else if (modifier == "<")
            {
                return (card_power < check);
            }
            else if (modifier == ">")
            {
                return (card_power > check);
            }
            else if (modifier == "<=")
            {
                return (card_power <= check);
            }
            else if (modifier == ">=")
            {
                return (card_power >= check);
            }
        }
        if (term == "tou" || term == "toughness")
        {
            if (modifier == "!" || modifier == "=")
            {
                return (card_toughness == check);
            }
            else if (modifier == ":")
            {
                return (card_toughness == check);
            }
            else if (modifier == "<")
            {
                return (card_toughness < check);
            }
            else if (modifier == ">")
            {
                return (card_toughness > check);
            }
            else if (modifier == "<=")
            {
                return (card_toughness <= check);
            }
            else if (modifier == ">=")
            {
                return (card_toughness >= check);
            }
        }
        if (term == "r" || term == "rarity")
        {
            rarities = [ "common", "uncommon", "rare", "mythic" ];
            for (const rarity of rarities)
            {
                if (rarity.startsWith(check))
                {
                    check = rarity;
                }
            }
            if (modifier == ":" || modifier == "!" || modifier == "=")
            {
                return (card_rarity == check);
            }
            else if (modifier == "<")
            {
                return rarities.includes(card_rarity) && rarities.indexOf(card_rarity) < rarities.indexOf(check);
            }
            else if (modifier == ">")
            {
                return rarities.includes(card_rarity) && rarities.indexOf(card_rarity) > rarities.indexOf(check);
            }
            else if (modifier == "<=")
            {
                return rarities.includes(card_rarity) && rarities.indexOf(card_rarity) <= rarities.indexOf(check);
            }
            else if (modifier == ">=")
            {
                return rarities.includes(card_rarity) && rarities.indexOf(card_rarity) >= rarities.indexOf(check);
            }
        }
        if (term == "e" || term == "set")
        {
            if (modifier == ":" || modifier == "!" || modifier == "=")
            {
                return (card_set == check);
            }
            /* unsupported flows
            else if (modifier == "<")
            {

            }
            else if (modifier == ">")
            {

            } */
        }
        if (term == "cube")
        {
            if (modifier == ":" || modifier == "!" || modifier == "=")
            {
                return (card_notes.includes("cube:" + check));
            }
        }
        if (term == "keyword" || term=="kw" || term == "has")
        {
            if (modifier == ":" || modifier == "!" || modifier == "=")
            {
                regex_kw1 = new RegExp(`(^|\n|, )${check}[^.]*($|\n|\\()`, "g");
                regex_kw2 = new RegExp(`(^|\n)${check} `, "g");
                return regex_kw1.test(card_oracle_text) || regex_kw2.test(card_oracle_text);
            }
            /* unsupported flows
            else if (modifier == "<")
            {

            }
            else if (modifier == ">")
            {

            } */
        }
        if (term == "f" || term=="format")
        {
            if (modifier == ":" || modifier == "!" || modifier == "=")
            {
                for (const set of sets_json.sets)
                {
                    if (set.set_code.toLowerCase() == card_set)
                    {
                        formats = [ "standard", "modern", "legacy" ];
                        set_formats = set.formats.toLowerCase().replace(' ','').split(',');

                        for (const format of set_formats)
                        {
                            if (formats.includes(format) && formats.includes(check))
                            {
                                if (formats.indexOf(format) < formats.indexOf(check))
                                {
                                    return true;
                                }
                            }
                        }

                        return set_formats.includes(check);
                    }
                }
            }
            return false;
        }
        if (term == "lore")
        {
            if (modifier == ":")
            {
                return card_name.includes(check) || card_ft.includes(check);
            }
        }
        if (term == "is")
        {
            if (modifier == ":" || modifier == "!" || modifier == "=")
            {
                // all of these are implemented individually
                if (check == "permanent")
                {
                    return !card_type.includes("instant") && !card_type.includes("sorcery");
                }
                if (check == "spell")
                {
                    return !card_type.includes("land");
                }
                if (check == "commander")
                {
                    return (card_type.includes("legendary") && card_type.includes("creature")) || card_oracle_text.includes("can be your commander");
                }
                if (check == "hybrid")
                {
                    for (let i = 0; i < card_cost.length - 2; i++)
                    {
                        if (card_cost[i] != '{' && card_cost[i] != '}' && card_cost[i + 1] != '{' && card_cost[i + 1] != '}' && !isDecimal(card_cost[i + 1]))
                        {
                            return true;
                        }
                    }
                    return false;
                }
            }
            /* unsupported flows
            else if (modifier == "<")
            {

            }
            else if (modifier == ">")
            {

            } */
        }
        if (term == "not")
        {
            return !searchToken(card, token.replace("not:", "is:"));
        }
        if (term == "tag")
        {
            if (modifier == ":" || modifier == "=" || modifier == "!")
            {
                regex = new RegExp("!tag " + check + "\\b");
                return regex.test(card_notes);
            }
        }
        if (term == "a" || term == "art" || term == "artist")
        {
            if (modifier == ":" || modifier == "=" || modifier == "!")
            {
                return card_artist.includes(check);
            }
        }
        if (term == "ft" || term == "flavor" || term == "flavortext")
        {
            if (modifier == ":")
            {
                return card_ft.includes(check);
            }
        }
        if (term == "godzilla" || term == "alias") {
            if (modifier == "!" || modifier == "=")
            {
                return card_alias == check;
            }
            else if (modifier == ":")
            {
                return card_alias.includes(check);
            }
            else if (modifier == "<")
            {
                return card_alias < check;
            }
            else if (modifier == ">")
            {
                return card_alias > check;
            }
        }
        if (modifier == ":" || modifier == "=" || modifier == "!") {
            let regex = new RegExp(`!tag<${term}> ${check}\\b`);
            return regex.test(card_notes);
        }
    }

    return card_name.includes(token);
}function isDecimal(char) {
    return char >= '0' && char <= '9';
}

function tokenize(text) {
    let tokens = [];

    for (let i = 0; i < text.length; i++)
    {
        if (i < text.length - 1)
        {
            if (text[i + 1] == '/')
            {
                tokens.push(text.substring(i, i + 3));
                i = i + 2;
            }
            else if (isDecimal(text[i]) && isDecimal(text[i + 1]))
            {
                tokens.push(text.substring(i, i + 2));
                i = i + 1;
            }
            else
            {
                tokens.push(text[i]);
            }
        }
        else
        {
            tokens.push(text[i]);
        }
    }

    return tokens;
}

function symbolize(text) {
    //This isn't needed now that the { & } are put into the cost & text by the exporter
    //let tokens = tokenize(text);
    //let symText = "";
    //for (const token of tokens)
    //{
    //	symText = symText + "{" + token + "}";
    //}

    return formatTextHTML(text);
}

function formatTextHTML(str) {
    if(!str)
        return "";
    str = str.replace(/[{]([^}]+)[}]/g, function(matched, _1) {
        let letters = _1.toLowerCase()
        return '<span class="mana mana-cost mana-' + letters + '"></span>';
    })
    return str;
}

function gridifyCard(card_stats, card_text = false, small = false, designer_notes = false) {
    const card_name = card_stats.card_title;
    rotate_card = !small && card_stats.rotated;

    if (!card_text)
    {
        return buildImgContainer(card_stats, true, rotate_card);			
    }

    const grid = document.createElement("div");
    grid.className = "image-grid";

    grid.appendChild(buildImgContainer(card_stats, false, rotate_card));
    
    const text = document.createElement("div");
    text.className = "card-text";
    text.id = "card-text";

    const name_cost = document.createElement("div");
    name_cost.className = "name-cost";
    name_cost.innerHTML = card_stats.card_title + (card_stats.Stars != "" ? '     ' + card_stats.Stars + '★' : "");
    text.appendChild(name_cost);

    const type = document.createElement("div");
    type.className = "type";
    type.textContent = card_stats.card_type;
    text.appendChild(type);

    const effect = document.createElement("div");
    effect.className = "effect";   
    effect.innerHTML += card_stats['Card Ability'];
    text.appendChild(effect);

    if(card_stats.pt != "")
    {
        const pt = document.createElement("div");
        pt.className = "pt";
        pt.textContent = card_stats.pt;
        text.appendChild(pt);
    }

    grid.appendChild(text);

    return grid;
}

function buildImgContainer(card_stats, hidden_title = false, rotate_card = false) {
    const imgContainer = document.createElement("div");
    imgContainer.className = "img-container";
    const id = card_stats.cardID;

    const img = document.createElement("img");
    img.className = "card-image";
    img.id = id;
    img.loading = "lazy";

    img.src = card_stats.Images;
    imgContainer.appendChild(img);

    return imgContainer;
}

function imgFlip(id, rotate_card = false) { // comments in here by aanginer
    const img = document.getElementById(id);
    const seconds = 0.2;

    img.style.transition = seconds.toString() + "s";
    img.style.transform = "rotateY(90deg)"; // rotate 90 degrees

    const rotated_img = document.getElementById("h-img");
    if (rotated_img)
    {
        rotated_img.style.transition = seconds.toString() + "s";
        rotated_img.style.transform = "rotateY(90deg) rotate(90deg)";

        if (rotate_card && rotated_img.style.opacity != "0") {
            setTimeout(() => {
                rotated_img.style.opacity = "0";
            }, (seconds / 2) * 1000);
        }
    }

    setTimeout(function() { // wait for the rotation, then set the image's src correctly
        const rotated_img = document.getElementById("h-img");

        const cardName = img.src;
        
        if (cardName.includes("_front"))
        {
            img.src = cardName.replace("_front", "_back");

            if (rotate_card)
            {
                rotated_img.style.opacity = "0";
                img.style.filter = "";
            }
        }
        else if (cardName.includes("_back"))
        {
            img.src = cardName.replace("_back", "_front");

            if (rotate_card)
            {
                rotated_img.style.opacity = "1";
                img.style.filter = "blur(2px) brightness(0.7)";
            }
        }

        img.style.transition = seconds.toString() + "s";
        img.style.transform = "rotateY(0deg)";

        if (rotated_img)
        {
            rotated_img.style.transition = seconds.toString() + "s";
            rotated_img.style.transform = "rotateY(0deg) rotate(90deg)";
        }
    }, seconds * 1000);
}

function prettifyEffects(card_effect) {
    let HTML = "";

    let styled_effect = card_effect.replace(/(\[i\])+(.+?)(\[\/i\])+/gs, function(matched, _1, _2) {
        return '<i>' + _2 + '</i>'
    }).replaceAll(/(\[b\])+(.+?)(\[\/b\])+/gs, function(matched, _1, _2) {
        return '<b>' + _2 + '</b>'
    });

    let card_effects = styled_effect.split("\n");

    for (let i = 0; i < card_effects.length; i++)
    {
        HTML += "<p>" + card_effects[i] + "</p>";
    }
    
    let regexHTML = symbolize(HTML);

    return regexHTML;
}

function hasAllChars(strOut, strIn) {
    let retVal = true;

    for (let i = 0; i < strIn.length; i++)
    {
        if (!strOut.includes(strIn.charAt(i)))
        {
            retVal = false;
        }
    }

    return retVal;
}

function hasNoChars(strOut, strIn) {
    let retVal = true;

    for (let i = 0; i < strIn.length; i++)
    {
        if (strOut.includes(strIn.charAt(i)))
        {
            retVal = false;
        }
    }

    return retVal;
}

function hasAllAndMoreChars(strOut, strIn) {
    let retVal = true;

    for (let i = 0; i < strIn.length; i++)
    {
        if (!strOut.includes(strIn.charAt(i)))
        {
            retVal = false;
        }
    }

    return retVal && (strOut.length > strIn.length);
}

function addCardToDeck(card) {
    deck.push(card);
    processDeck();
}

function addCardToSideboard(card) {
    sideboard.push(card);
    processDeck();
}

function processDeck() {
    const nct = document.getElementById("no-cards-text");
    nct.style.display = (deck.length == 0 && sideboard.length == 0) ? "block" : "none";

    const dc = document.getElementById("deck-count");
    dc.innerText = "(" + deck.length + " / " + sideboard.length + ")";

    let deck_cards = new Map([
        ['combiner', new Map([])],
        ['creature', new Map([])],
        ['resource', new Map([])],
        ['attachment', new Map([])],
        ['activator', new Map([])],
        ['moon', new Map([])],
        ['planet', new Map([])],
        ['sideboard', new Map([])]
    ]);

    for (const card of deck)
    {
        card_type = JSON.parse(card).card_type.toLowerCase();

        for (const [key, map] of deck_cards)
        {
            if (card_type.includes(key))
            {
                if (map.has(card))
                {
                    map.set(card, map.get(card) + 1);
                }
                else
                {
                    map.set(card, 1);
                }

                break;
            }
        }
    }
    for (const card of sideboard)
    {
        let map = deck_cards.get("sideboard");
        if (map.has(card))
        {
            map.set(card, map.get(card) + 1);
        }
        else
        {
            map.set(card, 1);
        }
    }

    for (const [key, map] of deck_cards)
    {
        dsec_id = "deck-" + key;
        outer_ele = document.getElementById(dsec_id);

        if (map.size == 0)
        {
            outer_ele.style.display = "none";
        }
        else
        {
            outer_ele.style.display = "grid";
            dsec_c_id = dsec_id + "-cards";
            
            dsec_t_id = dsec_id + "-title";
            title_ele = document.getElementById(dsec_t_id);
            let count = 0;
            for (const val of Array.from(map.values()))
            {
                count += val;
            }
            const numregex = /[0-9]+/;
            title_ele.innerText = title_ele.innerText.replace(numregex, count);

            cards_ele = document.getElementById(dsec_c_id);
            cards_ele.innerHTML = "";
            const cards_list = Array.from(map.keys()).sort();				
            for (const card of cards_list)
            {
                const display_style = document.getElementById("display-select").value;
                const card_stats = JSON.parse(card);
                const card_name = card_stats.card_title;

                if (display_style == "text")
                {
                    card_row = document.createElement("div");
                    card_row.className = "deck-line";
                    
                    card_in_deck = document.createElement("div");
                    card_in_deck.innerText += map.get(card) + " " + card_name + "\n";
                    card_in_deck.style.cursor = "pointer";
                    card_in_deck.onmouseover = function() {
                        cgc = document.getElementById("card-grid-container");
                        cgc.innerHTML = "";
                        const gridified_card = gridifyCard(card_stats, true);
                        gridified_card.getElementsByTagName("img")[0].id = "image-grid-card";
                        // gridified_card.getElementsByTagName("a")[0].removeAttribute("href");
                        
                        cgc.appendChild(gridified_card);
                    };

                    del_btn = document.createElement("img");
                    del_btn.className = "icon";
                    del_btn.style.cursor = "pointer";

                    add_btn = document.createElement("img");
                    add_btn.className = "icon";
                    add_btn.style.cursor = "pointer";

                    if (key == "sideboard")
                    {
                        del_btn.src = rootPath + "/img/sb-delete.png";
                        del_btn.onclick = function() {
                            sideboard.splice(sideboard.indexOf(card), 1);
                            processDeck();
                        }

                        add_btn.src = rootPath + "/img/sb-add.png";
                        add_btn.onclick = function() {
                            sideboard.push(card);
                            processDeck();
                        }

                        card_in_deck.onclick = function() {
                            sideboard.splice(sideboard.indexOf(card), 1);
                            addCardToDeck(card);
                        }
                    }
                    else
                    {
                        del_btn.src = rootPath + "/img/delete.png";
                        del_btn.onclick = function() {
                            deck.splice(deck.indexOf(card), 1);
                            processDeck();
                        }

                        add_btn.src = rootPath + "/img/add.png";
                        add_btn.onclick = function() {
                            deck.push(card);
                            processDeck();
                        }

                        card_in_deck.onclick = function() {
                            deck.splice(deck.indexOf(card), 1);
                            addCardToSideboard(card);
                        }
                    }

                    db_container = document.createElement("div");
                    db_container.className = "card-fx";
                    db_container.appendChild(del_btn);

                    ab_container = document.createElement("div");
                    ab_container.className = "card-fx";
                    ab_container.appendChild(add_btn);

                    card_row.appendChild(db_container);
                    card_row.appendChild(ab_container);
                    card_row.appendChild(card_in_deck);
                    cards_ele.appendChild(card_row);
                }
                else
                {
                    card_img_container = document.createElement("div");
                    card_img_container.className = "card-img-container";
                    if (card == cards_list[cards_list.length - 1])
                    {
                        card_img_container.style.height = "auto";
                        card_img_container.style.maxHeight = "100%";
                    }

                    card_img = document.createElement("img");
                    card_img.loading = "lazy";
                    
                    card_img.src = card_stats.Images;

                    card_img.style.cursor = "pointer";
                    card_img.onmouseover = function() {
                        cgc = document.getElementById("card-grid-container");
                        cgc.innerHTML = "";
                        const gridified_card = gridifyCard(card_stats, true);
                        gridified_card.getElementsByTagName("img")[0].id = "image-grid-card";
                        // gridified_card.getElementsByTagName("a")[0].removeAttribute("href");
                        // if (card_stats.shape.includes("double"))
                        // {
                        //     gridified_card.getElementsByTagName("button")[0].onclick = function() {
                        //         imgFlip("image-grid-card", card_stats.rotated);
                        //     }
                        // }
                        cgc.appendChild(gridified_card);
                    };

                    card_count = document.createElement("div");
                    card_count.innerText = map.get(card) + "x";

                    del_btn = document.createElement("img");
                    del_btn.className = "icon";
                    del_btn.style.cursor = "pointer";

                    add_btn = document.createElement("img");
                    add_btn.className = "icon";
                    add_btn.style.cursor = "pointer";

                    if (key == "sideboard")
                    {
                        del_btn.src = rootPath + "/img/sb-delete.png";
                        del_btn.onclick = function() {
                            sideboard.splice(sideboard.indexOf(card), 1);
                            processDeck();
                        }

                        add_btn.src = rootPath + "/img/sb-add.png";
                        add_btn.onclick = function() {
                            sideboard.push(card);
                            processDeck();
                        }

                        card_img.onclick = function() {
                            sideboard.splice(sideboard.indexOf(card), 1);
                            addCardToDeck(card);
                        }
                    }
                    else
                    {
                        del_btn.src = rootPath + "/img/delete.png";
                        del_btn.onclick = function() {
                            deck.splice(deck.indexOf(card), 1);
                            processDeck();
                        }

                        add_btn.src = rootPath + "/img/add.png";
                        add_btn.onclick = function() {
                            deck.push(card);
                            processDeck();
                        }

                        card_img.onclick = function() {
                            deck.splice(deck.indexOf(card), 1);
                            addCardToSideboard(card);
                        }
                    }

                    db_container = document.createElement("div");
                    db_container.className = "card-fx";
                    db_container.appendChild(del_btn);

                    ab_container = document.createElement("div");
                    ab_container.className = "card-fx";
                    ab_container.appendChild(add_btn);
                    card_count.className = "card-fx";

                    card_img_container.appendChild(db_container);
                    card_img_container.appendChild(ab_container);
                    card_img_container.appendChild(card_count);
                    card_img_container.appendChild(card_img);
                    cards_ele.appendChild(card_img_container);
                }
            }
        }
    }
}

async function exportFile(export_as) {
    let deck_text = "";
    let deck_name = document.getElementById("deck-name").value;
    // let export_cod = (export_as == "export-cod");

    // if (export_cod) {
    //     deck_text += `<?xml version="1.0" encoding="UTF-8"?>\n<cockatrice_deck version="1">\n\t<deckname>${deck_name}</deckname>\n\t<zone name="main">\n`;
    // }

    deck_text += `//play-1\n`;

    let map = new Map([]);
    for (const card of deck)
    {
        const card_stats = JSON.parse(card);
        if (card_stats.card_type == 'Planet') {
            deck_text += `1 ${card_stats.card_title}\n\n//deck-1\n`;
            continue;
        }
        if (map.has(card))
        {
            map.set(card, map.get(card) + 1);
        }
        else
        {
            map.set(card, 1);
        }
    }
    for (const card_map of Array.from(map.keys()))
    {

        let card_number = map.get(card_map);
        // if (export_cod) {
        //     deck_text += `\t\t<card number="${card_number}" name="${JSON.parse(card_map).card_name}"/>\n`;
        //     continue; // continue instead of writing else
        // }
        deck_text += card_number + " " + JSON.parse(card_map).card_title + "\n";
    }
    if (sideboard.length != 0)
    {
        deck_text += "\n\n//sideboard-1\n";
        map = new Map([]);
        for (const card of sideboard)
        {
            if (map.has(card))
            {
                map.set(card, map.get(card) + 1);
            }
            else
            {
                map.set(card, 1);
            }
        }
        for (const card_map of Array.from(map.keys()))
        {
            let card_number = map.get(card_map);
            deck_text += card_number + " " + JSON.parse(card_map).card_title + "\n"  ;
        }
    }

    // if (export_cod) {
    //     deck_text += "\t</zone>\n</cockatrice_deck>";
    // }

    if (export_as != "clipboard")
    {
        let downloadableLink = document.createElement('a');
        downloadableLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(deck_text));
        downloadableLink.download = deck_name + ("." + export_as.split("-")[1]);
        document.body.appendChild(downloadableLink);
        downloadableLink.click();
        document.body.removeChild(downloadableLink);
    }
    else
    {
        navigator.clipboard.writeText(deck_text);
    }

    document.getElementById("file-menu").value = "default";
}

async function importFromClipboard() {
    try {
        const deckText = await navigator.clipboard.readText();

        deck = [];
        sideboard = [];

        let deck_map = new Map();
        let sb_map = new Map();
        let sb_cards = false;

        for (let line of deckText.split('\n'))
        {
            line = line.trim();

            if (line == 'sideboard' || line == '') // '' for Draftmancer files
            {
                sb_cards = true;
            }
            else if (!sb_cards)
            {
                count = parseInt(line.substring(0, line.indexOf(' ')));
                card_name = line.substring(line.indexOf(' ') + 1);

                if (deck_map.has(card_name))
                {
                    deck_map.set(card_name, deck_map.get(card_name) + count);
                }
                else
                {
                    deck_map.set(card_name, count);
                }
            }
            else
            {
                count = parseInt(line.substring(0, line.indexOf(' ')));
                card_name = line.substring(line.indexOf(' ') + 1);

                if (sb_map.has(card_name))
                {
                    sb_map.set(card_name, sb_map.get(card_name) + count);
                }
                else
                {
                    sb_map.set(card_name, count);
                }
            }
        }
        for (const card of card_list_arrayified)
        {
            if (deck_map.has(card.card_title))
            {
                for (let i = 0; i < deck_map.get(card.card_title); i++)
                {
                    addCardToDeck(JSON.stringify(card));
                }
                deck_map.delete(card.card_title);
            }

            if (sb_map.has(card.card_title))
            {
                for (let i = 0; i < sb_map.get(card.card_title); i++)
                {
                    addCardToSideboard(JSON.stringify(card));
                }
                sb_map.delete(card.card_title);
            }
        }
    } catch (err) {
        console.error('Failed to read clipboard:', err);
    }
    document.getElementById("file-menu").value = "default";
}

function goToSearch() {
    window.location = (rootPath + "/search");
}

document.getElementById("search").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        preSearch();
    }
});

function randomCard() {
        let i = Math.floor(Math.random() * (card_list_arrayified.length + 1));
        let random_card = card_list_arrayified[i];

        const url = new URL(rootPath + '/card', window.location.href.split('?')[0].split('/').slice(0, -1).join('/') + '/');
        const params = {
            set: random_card.set,
            num: random_card.number,
            name: random_card.card_title
        }
        for (const key in params) {
            url.searchParams.append(key, params[key]);
        }

        window.location.href = url.pathname + url.search;
    }