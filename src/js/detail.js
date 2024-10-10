document.addEventListener('DOMContentLoaded', function () {
    let elems = document.querySelectorAll('.modal');
    let instances = M.Modal.init(elems);
});

window.ipcRenderer.on('credential:display', (event, args) => {
    console.log(args);

    document.getElementById('doc-id').value = args.id;

    const title = document.getElementById('saved-title');
    const website = document.getElementById('saved-website');
    const username = document.getElementById('saved-username');
    const password = document.getElementById('saved-password');
    const recovery_keys = document.getElementById('saved-recovery_keys');
    const length = document.getElementById('saved-length');
    const includeNumbers = document.getElementById('saved-include-numbers');
    const includeSymbols = document.getElementById('saved-include-symbols');

    title.value = args.title;
    website.value = args.credential.website;
    username.value = args.credential.username;
    password.value = args.credential.password;
    recovery_keys.value = args.credential.recovery_keys;

    length.value = args.credential.options.length;
    includeNumbers.checked = args.credential.options.includeNumbers;
    includeSymbols.checked = args.credential.options.includeSymbols;

    title.focus();
    website.focus();
    username.focus();
    password.focus();
    recovery_keys.focus();
    length.focus();
    includeNumbers.focus();
    includeSymbols.focus();

    M.updateTextFields();

});

document.getElementById('saved-password-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('doc-id').value
    const title = document.getElementById('saved-title').value;
    const website = document.getElementById('saved-website').value;
    const username = document.getElementById('saved-username').value;
    const password = document.getElementById('saved-password').value;
    const recovery_keys = document.getElementById('saved-recovery_keys').value;

    const length = password.length;
    const includeNumbers = /\d/.test(password);
    const includeSymbols = /[!@#$%^&*()]/.test(password);

    // Send save request to main process
    window.ipcRenderer.send('credential:save', {id, title, website, username, password, options: {length, includeNumbers, includeSymbols}, recovery_keys});

});

// Generate password function
document.getElementById('regenerate-btn').addEventListener('click', () => {
    const options = {
        length: document.getElementById('saved-length').value,
        includeNumbers: document.getElementById('saved-include-numbers').checked,
        includeSymbols: document.getElementById('saved-include-symbols').checked,
    };

    window.ipcRenderer.send('password:generate', {isUpdate: true, options});

});

window.ipcRenderer.on('password:generate:done', (event, args) => {
    if(args.isUpdate) {
        let password = document.getElementById('saved-password');
        password.value = args.password; // Set generated password in input field
        password.focus(); // Focus on the input field
        M.updateTextFields(); // Update Materialize CSS labels
    }

});

window.ipcRenderer.on('credential:save:done', (event, args) => {

    if (args.success && args.updated) {
        M.toast({html: 'Password updated successfully!'});
        document.getElementById('saved-password-form').reset();
        // window.ipcRenderer.send('close:detail:windows');
        window.ipcRenderer.send('credential:fetch:list');
    } else {
        M.toast({html: 'Error saving password: ' + args.error});
    }
});