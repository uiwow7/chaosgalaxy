let card_list;
let card_list_file;
let search_results = [];
const pageCount = 24;
const urlParams = new URLSearchParams(window.location.search);
let page = ( urlParams.get("page") ? parseInt(urlParams.get("page")) : 1 );
page -= 1;

window.addEventListener("DOMContentLoaded", async function() {
    await fetch('resources/database.json')
        .then(response => response.json())
        .then(json => {
            card_list_file = json;
    }).catch(error => console.error('Error:', error));

    card_list = [...card_list_file];

    document.getElementById("search").value = urlParams.get("search");

	preSearch();
});

function preSearch(reset = false) {
    if (reset) {
        card_list = [...card_list_file];
    }
    card_list.sort(sortFunction);
    if (document.getElementById("sort-direction").value == "descending")
    {
        card_list.reverse();
    }
    search_results = [];

    search();
}

function searchTerms(terms) {
    let tokenRegex = /-?\w*[!:<>=]?(([^ "\(\)\/“”]+)|(\".+?\")|(\(.+?\))|(\/.+?\/)|(\“.+?\”))/g;
    let searchTokens = terms.match(tokenRegex);

    return searchTokens;
}

function searchAllTokens(card, tokens) {
    if (tokens == null || tokens == '')
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


function search() {
    terms = document.getElementById("search").value.toLowerCase();

    let cardGrid = document.getElementById("card-grid");
    cardGrid.innerHTML = "";

    document.getElementById("nextBtn").innerText = "Next " + pageCount + " >";
	document.getElementById("prevBtn").innerText = "< " + "Previous " + pageCount;

    if (page != 0)
    {
        document.getElementById("prevBtn").disabled = false;
        // document.getElementById("prevBtn-footer").disabled = false;
    }
    else
    {
        document.getElementById("prevBtn").disabled = true;
        // document.getElementById("prevBtn-footer").disabled = true;
    }

    for (const card of card_list) {
        let searched = searchAllTokens(card, searchTerms(terms));

        if (searched)
        {
            search_results.push(card);
        }
    }

    for (let i = (pageCount * page); i < Math.min((pageCount * (page + 1)), search_results.length); i++)
    {
        cardGrid.appendChild(gridifyCard(search_results[i]));
    }

    if (search_results.length <= (pageCount * (page + 1)))
    {
        document.getElementById("nextBtn").disabled = true;
        // document.getElementById("nextBtn-footer").disabled = true;
    }
    else
    {
        document.getElementById("nextBtn").disabled = false;
        // document.getElementById("nextBtn-footer").disabled = false;
    }

    if (search_results.length < 10) {
        // document.getElementById("nextBtn-footer").style.display = "none";
        // document.getElementById("prevBtn-footer").style.display = "none";
    }
    if (search_results.length > 10) {
        // document.getElementById("nextBtn-footer").style.display = "";
        // document.getElementById("prevBtn-footer").style.display = "";
    }

    document.getElementById("page-count").innerText = "Page " + (page + 1) + " of " + Math.ceil(search_results.length / pageCount);

    // for (let i = 0; i < search_results.length; i++)
    // {
    //     const imgContainer = document.createElement("div");
    //     const card_stats = search_results[i];
    //     imgContainer.className = "img-container";
    //     const card_grid = gridifyCard(search_results[i]);

    //     card_grid.onmouseover = function() {
    //         card_preview = document.getElementById("card-grid-container");
    //         card_preview.innerHTML = "";
    //         const gridified_card = gridifyCard(card_stats);
    //         // gridified_card.getElementsByTagName("img")[0].id = "image-grid-card";
    //         // gridified_card.getElementsByTagName("a")[0].removeAttribute("href");
    //         card_preview.appendChild(gridified_card);
    //     };

    //     imgContainer.appendChild(card_grid);
    //     cardGrid.appendChild(imgContainer);
    // }
}

function searchToken(card, token) {
    let card_stats = [];

    for (var key in card)
    {
        if (isNaN(card[key]))
        {
            card_stats[key] = card[key];
        }
        else
        {
            card_stats[key] = card[key];
        }
    }

    const card_title = card_stats.card_title.toLowerCase();
    const card_type = card_stats.card_type.toLowerCase();
    const card_banned = card_stats.banlist.toLowerCase();

    token = token.replaceAll("~", card_title).replaceAll("cardname", card_title).replaceAll('"','').replaceAll('“','').replaceAll('”','');

    const modifierRegex = /[!:<>=]+/g;
    const match = token.match(modifierRegex);

    if (match)
    {
        const modifier = match[0];
        const term = token.substring(0, token.indexOf(modifier));
        let check = token.substring(token.indexOf(modifier) + modifier.length);

        if (check.charAt(0) == '/')
        {
            check = check.substring(1);
        }
        if (check.charAt(check.length - 1) == '/')
        {
            check = check.substring(0,check.length - 1);
        }


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

        if (term == "t" || term == "type" || term == "cardtype")
        {
            if (modifier == "!" || modifier == "=")
            {
                return card_type == check;
            }
            else if (modifier == ":")
            {
                return card_type.includes(check);
            }
            else if (modifier == "<")
            {
                return card_type < check;
            }
            else if (modifier == ">")
            {
                return card_type > check;
            }
        } else if (term == "b" || term == "ban" || term == "banlist") {
            if (modifier == "!" || modifier == "=")
            {
                return card_banned == formatBanlist(check);
            }
            else if (modifier == ":")
            {
                return card_banned.includes(formatBanlist(check));
            }
            else if (modifier == "<")
            {
                return banlistCheck(card_banned, modifier, check);
            }
            else if (modifier == ">")
            {
                return banlistChecks(card_banned, modifier, check);
            }
        }
    }
    let regex = new RegExp(token.replaceAll("+","\\+"));
    return (regex.test(card_stats.special_text) && (localStorage.getItem('settings.searchalias') == "On")) || card_title.includes(token);
}

function formatBanlist(val) {
    if (val == "banned" || val == "ban" || val == "forbidden") {
        return "banned";
    }
    if (val == "limited" || val == "half" || val == "half-banned" || val == "halfbanned" || val) {
        return "limited";
    }
    if (val == "banned" || val == "ban" || val == "forbidden") {
        return "banned";
    }
}

document.getElementById("search").addEventListener("keypress", (e) => {
    document.getElementById("search").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            // window.location.search = "?search=" + document.getElementById("search").value + "&page=" + (page + 1);
            page = 0;
            preSearch();
        }
    });
})

function gridifyCard(card) {
    const img_container = document.createElement("div");
    img_container.className = "img-container";

    const card_img = document.createElement("img");
    card_img.src = card.Images;
    card_img.className = "gridified-card";

    img_container.appendChild(card_img);

    return img_container;
}

function sortFunction(a ,b) {
    const sort_order = document.getElementById("sort-order").value;
    if (sort_order == "name") {
        if (a.card_title === b.card_title)
        {
            return 0;
        }
        else {
            return (a.card_title < b.card_title) ? -1 : 1;
        }
    }
    if (sort_order == "type") {
        if (a.card_type === b.card_type)
        {
            return 0;
        }
        else {
            return (a.card_type < b.card_type) ? -1 : 1;
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
    if (sort_order == "stars") {
        if (a.Stars === b.Stars)
        {
            return 0;
        }
        else {
            return (a.Stars < b.Stars) ? -1 : 1;
        }
    }
    if (sort_order == "set") {
        if (a.Sets === b.Sets)
        {
            return 0;
        }
        else {
            return (a.Sets < b.Sets) ? -1 : 1;
        }
    }
    if (sort_order == "rarity") {
        const a_rarity = Object.keys(a.Rarities)[0];
        const b_rarity = Object.keys(b.Rarities)[0];
        if (a_rarity === b_rarity)
        {
            return 0;
        }
        else {
            return (a_rarity < b_rarity) ? -1 : 1;
        }
    }
    if (sort_order == "cardid") {
        if (a.ID === b.ID)
        {
            return 0;
        }
        else {
            return (a.ID < b.ID) ? -1 : 1;
        }
    }
}

function nextPage() {
    page += 1;
    preSearch();
}

function previousPage() {
    page -= 1;
    preSearch();
}