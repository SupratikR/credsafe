document.addEventListener('DOMContentLoaded', function () {
    let elems = document.querySelectorAll('.modal');
    let instances = M.Modal.init(elems);

    window.ipcRenderer.send('credential:fetch:list');
});

// Save password function
document.getElementById('password-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const website = document.getElementById('website').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const recovery_keys = document.getElementById('recovery_keys').value;

    const length = password.length;
    const includeNumbers = /\d/.test(password);
    const includeSymbols = /[!@#$%^&*()]/.test(password);

    // Send save request to main process
    window.ipcRenderer.send('credential:save', {title, website, username, password, options: {length, includeNumbers, includeSymbols}, recovery_keys});

});

// Generate password function
document.getElementById('generate-btn').addEventListener('click', () => {
    const options = {
        length: document.getElementById('length').value,
        includeNumbers: document.getElementById('include-numbers').checked,
        includeSymbols: document.getElementById('include-symbols').checked,
    };

    window.ipcRenderer.send('password:generate', options);

});

window.ipcRenderer.on('credential:fetch:list:done', (event, args) => {
    const credentialList = document.getElementById('credential-list');
    credentialList.innerHTML = '' // clearing the existing list

    for(let el of args) {
        // <span class="title">Title</span>
        // <p>First Line <br>
        //     Second Line
        // </p>
        // <a href="#!" class="secondary-content"><i class="material-icons">grade</i></a>
        const li = document.createElement('li');
        const span = document.createElement('span');
        const p = document.createElement('p');
        const a = document.createElement('a');
        const i2 = document.createElement('i');

        li.setAttribute('class', 'collection-item avatar grey darken-4');

        span.setAttribute('class', 'title');
        span.innerText = el.title;

        p.innerText = el.createdAt;

        a.setAttribute('class', 'secondary-content');
        a.style.cursor = 'pointer';
        i2.setAttribute('class', 'material-icons');
        i2.innerText = 'open_in_new';
        a.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent the default context menu from appearing
            window.ipcRenderer.send('show:credential:details', el); // Send message to show details
        });

        a.appendChild(i2);

        li.append(span, p, a);

        credentialList.appendChild(li);
    }


});

window.ipcRenderer.on('password:generate:done', (event, args) => {
    let password = document.getElementById('password');
    password.value = args.password; // Set generated password in input field
    password.focus(); // Focus on the input field
    M.updateTextFields(); // Update Materialize CSS labels
});

window.ipcRenderer.on('credential:save:done', (event, args) => {
    console.log(args);
    if (args.success) {
        M.toast({html: 'Password saved successfully!'});
        document.getElementById('password-form').reset();
        window.ipcRenderer.send('credential:fetch:list');
    } else {
        M.toast({html: 'Error saving password: ' + args.error});
    }
});