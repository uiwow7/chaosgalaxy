let card_list;
let search_results = [];
const pageCount = 24;
const urlParams = new URLSearchParams(window.location.search);
let page = ( urlParams.get("page") ? parseInt(urlParams.get("page")) : 1 );
page -= 1;

window.addEventListener("DOMContentLoaded", async function() {
    await fetch('resources/database.json')
        .then(response => response.json())
        .then(json => {
            card_list = json;
    }).catch(error => console.error('Error:', error));

    document.getElementById("search").value = urlParams.get("search");

	preSearch();
});

function preSearch() {
    card_list.sort(sortFunction);
    if (document.getElementById("sort-order").value == "descending")
    {
        card_list_arrayified.reverse();
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

    for (const card of card_list) {
        searched = searchAllTokens(card, searchTerms(terms));

        if (searched)
        {
            search_results.push(card);
        }
    }

    console.log(pageCount * page, Math.min((pageCount * (page + 1))), search_results.length, search_results)
    for (let i = (pageCount * page); i < Math.min((pageCount * (page + 1)), search_results.length); i++)
    {
        console.log("looping");
        cardGrid.appendChild(gridifyCard(search_results[i]));
    }

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

    const card_name = card_stats["Card Title"].toLowerCase();

    token = token.replaceAll("~", card_name).replaceAll("cardname", card_name).replaceAll('"','').replaceAll('“','').replaceAll('”','');

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

        if (color_map.has(check))
        {
            check = color_map.get(check);
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
    }
    let regex = new RegExp(token.replaceAll("+","\\+"));
    return (regex.test(card_stats.special_text) && (localStorage.getItem('settings.searchalias') == "On")) || card_name.includes(token);
}

document.getElementById("search").addEventListener("keypress", (e) => {
    document.getElementById("search").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            window.location.href = "?search=" + document.getElementById("search").value + "&page=" + (page + 1);
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
    return 0;
}