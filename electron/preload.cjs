const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronBridge', {
  async connect() {
    return true
  },
  async startNfcSession() {
    return false
  },
  async readNdefOnce() {
    return null
  },
})

