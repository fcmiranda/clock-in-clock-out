Certainly! Below is a Node.js application written in TypeScript that logs timestamps every time you log in and log off or shut down your computer. The data is saved in a JSON file called `attendance.json`.

---

### **1. Setup the Node.js Project**

**a. Initialize the Project**

```bash
mkdir time-tracker
cd time-tracker
npm init -y
```

**b. Install Dependencies**

```bash
npm install --save-dev typescript ts-node @types/node
```

**c. Initialize TypeScript Configuration**

```bash
npx tsc --init
```

This will create a `tsconfig.json` file with default settings.

---

### **2. Create the Logging Script**

**a. Create a File Named `logger.ts`**

```typescript
// logger.ts

import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
  timestamp: string;
  event: string;
}

const logEvent = (event: string) => {
  const logFilePath = path.join(__dirname, 'attendance.json');

  let logData: LogEntry[] = [];

  // Read existing data if the file exists
  if (fs.existsSync(logFilePath)) {
    const rawData = fs.readFileSync(logFilePath, 'utf8');
    if (rawData) {
      logData = JSON.parse(rawData);
    }
  }

  // Append the new log entry
  logData.push({
    timestamp: new Date().toISOString(),
    event: event,
  });

  // Write the updated data back to the file
  fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
};

// Get the event type from command-line arguments
const eventType = process.argv[2];

if (eventType === 'login' || eventType === 'logout') {
  logEvent(eventType);
} else {
  console.error('Invalid event type. Use "login" or "logout".');
}
```

This script:

- Reads the existing `attendance.json` file (if it exists).
- Adds a new entry with the current timestamp and event type (`login` or `logout`).
- Writes the updated data back to `attendance.json`.

**b. Compile the TypeScript File**

```bash
npx tsc logger.ts
```

This will generate a `logger.js` file in the same directory.

---

### **3. Automate the Script Execution**

**a. Running the Script at Login**

- **Windows:**

  - Press `Win + R`, type `shell:startup`, and press Enter. This opens the Startup folder.
  - Create a new batch file named `login.bat` with the following content:

    ```bat
    node "C:\path\to\time-tracker\logger.js" login
    ```

  - Place this batch file in the Startup folder.

- **macOS/Linux:**

  - Add the following command to your shell's profile script (`~/.bash_profile`, `~/.zshrc`, or `~/.bashrc`):

    ```bash
    node /path/to/time-tracker/logger.js login
    ```

**b. Running the Script at Logout or Shutdown**

- **Windows:**

  - Open the Group Policy Editor (`gpedit.msc`).
  - Navigate to `User Configuration` > `Windows Settings` > `Scripts (Logon/Logoff)`.
  - Double-click on `Logoff`, click `Add`, and provide the script:

    ```bat
    node "C:\path\to\time-tracker\logger.js" logout
    ```

- **macOS/Linux:**

  - Create a logout script, e.g., `logout.sh`, with the following content:

    ```bash
    #!/bin/bash
    node /path/to/time-tracker/logger.js logout
    ```

  - Make the script executable:

    ```bash
    chmod +x logout.sh
    ```

  - For macOS, set it as a LogoutHook:

    ```bash
    sudo defaults write com.apple.loginwindow LogoutHook /path/to/logout.sh
    ```

  - For Linux, you can place the script in `/etc/logout.d/` or use systemd services.

---

### **4. Ensure Node.js Accessibility**

Make sure the `node` command is accessible in the environment where the script runs. If not, use the full path to the Node.js executable.

---

### **5. Example of `attendance.json`**

After running the scripts, the `attendance.json` file will look like this:

```json
[
  {
    "timestamp": "2023-10-01T08:00:00.000Z",
    "event": "login"
  },
  {
    "timestamp": "2023-10-01T17:00:00.000Z",
    "event": "logout"
  }
]
```

---

### **6. Additional Notes**

- **Permissions:** Ensure that the user running the scripts has read/write permissions to the `attendance.json` file and the directory.
- **Time Zones:** The timestamps are recorded in ISO format (UTC). If you need local time, you can modify the timestamp generation.
- **Error Handling:** The script includes basic error handling. You may enhance it as needed.

---

### **7. Modifying the Script for Local Time**

If you prefer to record the timestamps in your local time zone, adjust the `logEvent` function:

```typescript
// Replace this line
timestamp: new Date().toISOString(),

// With this line
timestamp: new Date().toLocaleString(),
```

---

### **8. Testing the Script**

You can manually test the script by running:

```bash
node logger.js login
node logger.js logout
```

Ensure that entries are being added to `attendance.json`.

---

### **9. Potential Enhancements**

- **Create a Service:** Instead of running scripts at login/logout, you could create a background service that listens for system events.
- **Cross-Platform Event Listening:** Use packages like `node-os-utils` or `systeminformation` to detect user sessions.
- **Data Security:** If the data is sensitive, consider encrypting the `attendance.json` file.

---

### **Conclusion**

You now have a Node.js application in TypeScript that logs your login and logout times to a JSON file. This setup provides a simple way to track your daily computer usage.

---

**Feel free to ask if you need assistance with setting up the scripts on your specific operating system or if you'd like to expand the functionality further.**