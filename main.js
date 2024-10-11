const {initializeApp} = require('firebase/app');
const {getFirestore,
    query,
    doc,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    orderBy
} = require('firebase/firestore');
const crypto = require('crypto');
const {app, BrowserWindow, ipcMain, Menu} = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const {v4: uuidv4} = require('uuid');
const CryptoJS = require('crypto-js');
const moment = require("moment");
require('dotenv').config();

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DB_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

let mainWindow;
let detailWindow;

// Function to create the main window
function createMainWindow() {

    if (!fs.existsSync(path.join(process.cwd(), '.metadata'))) {
        let metadata = `APP_ID=${uuidv4()}\nOS=${os.platform()}\nCHROME=${process.versions.chrome}\nELECTRON=${process.versions.electron}\n`

        fs.writeFileSync(path.join(process.cwd(), '.metadata'), metadata, {encoding: 'utf8'});
    }

    if (!fs.existsSync(path.join(process.cwd(), '.keystore'))) {
        let key = crypto.randomBytes(32).toString('hex');

        fs.writeFileSync(path.join(process.cwd(), '.keystore'), `KEY=${key}`, {encoding: 'utf8'});
    }

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(process.cwd(), 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: true
        },
        icon: path.join(process.cwd(), 'build/icons/icons8-laptop-password-bubbles-384.png')
    });

    mainWindow.loadFile('./build/MainWindow.html');
}

// Function to create the detail window
function createDetailWindow(credential) {
    detailWindow =  new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: {
            preload: path.join(process.cwd(), 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: true
        },
        icon: path.join(process.cwd(), 'build/icons/icons8-laptop-password-bubbles-384.png')
    });

    detailWindow.loadFile('./build/DetailWindow.html');

    detailWindow.webContents.on('did-finish-load', () => {
        detailWindow.webContents.send('credential:display', credential);
    });
}

// Listen for credential load request
ipcMain.on('credential:fetch:list', async (event, args) => {
    const querySnapshot = await getDocs(query(collection(db, "credentials"), orderBy('createdAt', 'desc')));
    const data = [];
    querySnapshot.forEach((doc) => {
        data.push({id: doc.id, ...doc.data()}); // Add document ID and data to the array
    });

    // event.reply('credential:fetch:list:done', data);
    mainWindow.webContents.send('credential:fetch:list:done', data);
});

// Listen for request to save credential
ipcMain.on('credential:save', async (event, {id, title, website, username, password, options, recovery_keys}) => {
    try {
        const keystore = fs.readFileSync(path.join(process.cwd(), '.keystore'), {encoding: 'utf8'}); // Use a secure key management approach in production

        let keystoreParts = keystore.split('\n');
        let SECRET_KEY = keystoreParts[0].split('=')[1];

        const payload = {website, username, password, options, recovery_keys};

        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), SECRET_KEY).toString();

        let metadata = fs.readFileSync(path.join(process.cwd(), '.metadata'), {encoding: 'utf8'});
        let metadataParts = metadata.split('\n');
        let appId = metadataParts[0].split('=')[1];

        let dbEntry = {
            appId,
            title,
            credential: encrypted,
            // createdAt: moment().format('YYYY-MM-DD')
        }

        if(id) {
            let credRef = doc(db, 'credentials', id);
            await updateDoc(credRef, dbEntry);
            event.reply('credential:save:done', {success: true, updated: true});
        } else {
            dbEntry = {...dbEntry, createdAt: moment().format('YYYY-MM-DD') };
            await addDoc(collection(db, "credentials"), dbEntry);
            event.reply('credential:save:done', {success: true, updated: false});
        }


    } catch (error) {
        console.error("Error saving password: ", error);
        event.reply('credential:save:done', {success: false, error});
    }
});

// Listen for request to generate secure random password
ipcMain.on('password:generate', (event, args) => {

    const isUpdate = args.isUpdate;
    const {length, includeNumbers, includeSymbols} = args.options;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" +
        (includeNumbers ? "0123456789" : "") +
        (includeSymbols ? "!@#$%^&*()" : "");

    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }

    event.reply('password:generate:done', ({isUpdate, password}))
    // mainWindow.webContents.send('password:generate:done', ({password}));
});

// Listen for request to show credential details
ipcMain.on('show:credential:details', (event, args) => {
    // decrypt the message
    const keystore = fs.readFileSync(path.join(process.cwd(), '.keystore'), {encoding: 'utf8'}); // Use a secure key management approach in production
    let keystoreParts = keystore.split('\n');
    let SECRET_KEY = keystoreParts[0].split('=')[1];

    const bytes = CryptoJS.AES.decrypt(args.credential, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    let credential = JSON.parse(decrypted);

    // open detail window
    createDetailWindow({...args, credential});
});

ipcMain.on('close:detail:windows', (event, args) => {
    detailWindow.close();
})

// Application lifecycle events
app.whenReady().then(createMainWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});
