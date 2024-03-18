// load pyodide.js
importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  self.postMessage({ type: "log", line: line });
}

// Initialize pyodide and load Pandas
async function initialize() {
  self.pyodide = await loadPyodide({ messageCallback: log });
  //   await self.pyodide.loadPackage("pandas", { messageCallback: log });
  //   await self.pyodide.loadPackage("micropip", { messageCallback: log });
  //   const micropip = pyodide.pyimport("micropip");
  //   await micropip.install("aiohttp");
  //   await micropip.install("requests");
}

let initialized = initialize();

self.onmessage = async (e) => {
  console.log("worker: got message", e);

  self.postMessage({ type: "load-status", loading: true });
  log("Loading Pyodide, may take some time ...");
  start = new Date();
  await initialized;
  self.postMessage({ type: "load-status" });
  log(`Loading done in ${(new Date() - start) / 1000} sec`);

  // fetch main.py, save it in browser memory
  await self.pyodide.runPythonAsync(`
    #import micropip
    #await micropip.install("aiohttp==3.9.3")
    from pyodide.http import pyfetch
    response = await pyfetch("main.py")
    with open("main.py", "wb") as f:
        f.write(await response.bytes())
  `);

  // Importing fetched py module
  pkg = pyodide.pyimport("main");

  // do work
  try {
    const _data = await pkg.greet(e.data);
    const data = _data.toJs({
      dict_converter: Object.fromEntries,
    });
    console.log('got data back from Python', data);

    self.postMessage({
      type: "greet",
      hello: "world!",
      ...data,
    });
  } catch (error) {
    self.postMessage({ type: "error", error: error.message });
  }
};
