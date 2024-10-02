const { exec } = require('child_process');
const dbus = require('dbus-next');

const sessionBus = dbus.sessionBus();

sessionBus.getProxyObject('org.gnome.ScreenSaver', '/org/gnome/ScreenSaver').then((obj) => {
    const screenSaver = obj.getInterface('org.gnome.ScreenSaver');

    // Listen for ActiveChanged signals
    screenSaver.on('ActiveChanged', (active) => {
        if (active) {
            console.log('Screen locked')
            // Screen locked
            exec('/home/felipemiranda/.nvm/versions/node/v20.17.0/bin/node /home/felipemiranda/dev/github/fcmiranda/clock-in-clock-out/logger.js screenLock');
        } else {
            console.log('Screen unlocked')
            // Screen unlocked
            exec('/home/felipemiranda/.nvm/versions/node/v20.17.0/bin/node /home/felipemiranda/dev/github/fcmiranda/clock-in-clock-out/logger.js screenUnlock');
        }
    });
}).catch((err) => {
    console.error('Failed to connect to D-Bus:', err);
});
