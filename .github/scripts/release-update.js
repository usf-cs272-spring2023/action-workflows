// checks the status from previous jobs and updates the release
module.exports = async ({github, context, core}) => {
  const results = process.env.RESULTS;
  core.info(results);
  core.info('');
  
  const json = JSON.parse(results);
  core.info(JSON.stringify(json, null, "  "));



};