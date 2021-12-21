const http = require('http');
let shell = require('shelljs');
let fs = require('fs');
let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

let debug = false;

function getLiquidCtlOutput() {
  return new Promise((resolve, reject) => {
    let command = config.liquidctlPath + " " + config.liquictlArgs;
    // console.log(command);
    let child = shell.exec(command, {async: true, silent: true});

    child.stderr.on('data', function (data) {
      if (debug)
        console.log('something went wrong');
      reject(data);
    })

    child.stdout.on('data', function (data) {
      if (debug)
        console.log(data);
      //TODO reject on erogenous data from cmd line
      let obj = JSON.parse(data);
      // we only want the status section
      let stati = obj[0].status;
      if (debug) console.log(stati);
      let newStati = stati.map(item => {
        return convertStatusEntry(item)
      });
      // convert array of objects to object with key/value
      let haFriendly = Object.assign({}, ...newStati);
      if (debug)
        console.log(haFriendly)
      resolve(haFriendly);
    });
  }
)
}

/**
 * remove the unit, and sanitize keys
 * @param item
 * @returns {any}
 */
function convertStatusEntry(item) {
  //remove "+ and replace space with _
  let newKey = item.key.replaceAll(' ', '_').replaceAll('+','');
  let newString = `{"${newKey}" : "${item.value}"}`;
  return JSON.parse(newString);
}

async function requestListener(req, res) {
  let output;
  try {
    output = await getLiquidCtlOutput()
  } catch (e) {
    // retry
    if (debug) {
      console.log(e);
      console.log('got error - retrying');
      console.log('output: ' + output);
    }
    output = await getLiquidCtlOutput();
  }
  res.writeHead(200, {"Content-Type": "application/json"})
  res.write(JSON.stringify(output));
  res.end();
}

const server = http.createServer(requestListener);
server.listen(8001);


// async function test()
// {
//   let text = await getLiquidCtlOutput();
//   console.log(text);
// }
// test();