// checks the status from previous jobs and updates the release
module.exports = async ({github, context, core}) => {
  const results = process.env.RESULTS;
  const json = JSON.parse(results);

  for (const property in json) {
    if (json[property].hasOwnProperty('outputs')) {
      if (json[property]['outputs'].hasOwnProperty('status')) {
        const parsed = JSON.parse(json[property]['outputs']['status']);
        json[property]['outputs']['status'] = parsed;
      }
    }
  }

  core.info(JSON.stringify(json, null, '  '));


  const titles = [
    'Request Project Design Grade',
    'Request Project Review Grade',
    'Request Project Tests Grade',
    'Request Project Code Review'
  ];



};