// creates pull request for this release
module.exports = async ({github, context, core}) => {
  const error_messages = [];
  const output = {};

  const zone = 'America/Los_Angeles';
  const eod = 'T23:59:59';
  Settings.defaultZone = zone;

  try {
    const review_json = JSON.parse(process.env.REVIEW_JSON);
    const release = process.env.RELEASE_TAG;

    core.info(JSON.stringify(review_json, null, '  '));
    // const major = parseInt(process.env.VERSION_MAJOR);


    // const title = `${} Review ${}`;

    // const minor = parseInt(process.env.VERSION_MINOR);
    // const patch = parseInt(process.env.VERSION_PATCH);

    // find most recent code review

    // determine type of code review

    // calculate earliest eligible date

    // 

    error_messages.push('Not yet implemented.');
  }
  catch (error) {
    // add error and output stack trace
    error_messages.push(`Unexpected error: ${error.message}`);

    core.info('');
    core.startGroup(`Unexpected ${error.name} encountered...`);
    core.info(error.stack);
    core.endGroup();
  }
  finally {
    // output and set results
    core.startGroup('Setting output...');
    for (const property in output) {
      console.log(`${property}: ${output[property]}`);
      core.setOutput(property, output[property]);
    }
    core.endGroup();

    // save and output all errors
    if (error_messages.length > 0) {
      const formatted = error_messages.map(x => `  1. ${x}\n`).join('');
      core.setOutput('error_messages', formatted);

      core.startGroup(`Outputting errors...`);
      for (const message of error_messages) {
        core.error(message);
      }
      core.endGroup();

      core.setFailed(`Found ${error_messages.length} problems while verifying this request.`);
    }
  }
};