const http = require('http');
let shell = require('shelljs');
let fs = require('fs');
let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

function getLiquidCtlOutput() {
  return new Promise((resolve, reject) => {
    let command = config.liquidctlPath + " " + config.liquictlArgs;
    console.log(command);
    let child = shell.exec(command, {async: true, silent: true});

    child.stdout.on('data', function (data) {
      //TODO reject on erogenous data from cmd line
      let obj = JSON.parse(data);
      let stati = obj[0].status;
      // console.log(stati);
      let newStati = stati.map(item => {
        // console.log(item);
        return convertStatusEntry(item)
      });
      console.log(newStati);
      resolve(newStati);
    });
  }
)
}

function convertStatusEntry(item) {
  let newKey = item.key.replaceAll(' ', '_').replaceAll('+','');
  let newString = `{"${newKey}" : "${item.value} ${item.unit}"}`;
  return JSON.parse(newString);
}

async function requestListener(req, res) {
  // res.setEncoding('utf8');
  const output = await getLiquidCtlOutput();
  res.writeHead(200, {"Content-Type": "application/json"})
  res.write(JSON.stringify(output));
  res.end();
}

const server = http.createServer(requestListener);
server.listen(8000);


// async function test()
// {
//   let text = await getLiquidCtlOutput();
//   console.log(text);
// }
// test();