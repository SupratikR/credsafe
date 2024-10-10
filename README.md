# CredSafe

A secure and user-friendly desktop application for storing and managing credentials, including usernames, passwords, and recovery keys. Built with Electron and Materialize CSS, this application allows users to generate secure passwords and manage their sensitive information efficiently.

## Features

- **User-Friendly Form**: Submit details such as title, website, username, password, and recovery keys.
- **Secure Password Generation**: Generate strong random passwords based on user-defined settings (length, inclusion of numbers, symbols).
- **Data Encryption**: All sensitive information (except title) is encrypted using AES before being stored in Firestore.
- **Credential Management**: View a list of stored credentials and access their details.
- **Responsive Design**: Built with Materialize CSS for a modern and responsive user interface.

## Technologies Used

- **Electron**: For building cross-platform desktop applications.
- **Firebase Firestore**: For storing encrypted credential data.
- **CryptoJS**: For encrypting and decrypting sensitive information.
- **Materialize CSS**: For styling the application with a responsive design.