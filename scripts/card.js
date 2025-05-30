window.addEventListener("DOMContentLoaded", async function() {
    await fetch('resources/database.json')
        .then(response => response.json())
        .then(json => {
            card_list_file = json;
    }).catch(error => console.error('Error:', error));
});